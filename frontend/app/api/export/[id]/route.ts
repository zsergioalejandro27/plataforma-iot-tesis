import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMetricValue } from "@/lib/device-status";
import { METRIC_CATALOG } from "@/lib/metric-catalog";

// Descarga todas las lecturas de un dispositivo como CSV.
//
// GET /api/export/<id del dispositivo>   (botón "Exportar CSV" de la pestaña Lecturas)
//
// Usa la sesión del usuario (no la llave de servicio): RLS garantiza que solo
// pueda exportar dispositivos de su propia organización. El cupo diario lo
// cuenta la función SQL register_export; solo se gasta si el CSV se arma bien.
// Respuestas: 200 (CSV), 401, 404, 429 (sin cupo), 500.
export const runtime = "nodejs";

const PAGE_SIZE = 1000; // Supabase devuelve como máximo 1000 filas por consulta
const MAX_ROWS = 100_000; // tope de seguridad para no colgar el servidor

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

// Encierra un texto entre comillas si trae comas, comillas o saltos de línea.
// Además, si empieza por = + - @, Excel lo tomaría como fórmula: se le antepone
// un apóstrofo para que se vea como texto (solo en columnas de texto).
function csvText(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// "sv-SE" formatea como 2026-11-09 14:05:33, que Excel y Python leen como fecha.
const bogotaFormat = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Bogota",
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    return json(401, { error: "Inicia sesión para exportar" });
  }

  // Por RLS, si el dispositivo es de otra organización esto llega vacío.
  const { data: device } = await supabase
    .from("devices")
    .select("id, name, device_key, metric_key, unit")
    .eq("id", id)
    .maybeSingle();
  if (!device) {
    return json(404, { error: "Dispositivo no encontrado" });
  }

  // Primero se leen todas las lecturas (en páginas de 1000) y después se
  // registra la exportación: si la lectura falla, no se gasta cupo.
  const rows: { recorded_at: string; payload: unknown }[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("telemetry")
      .select("id, recorded_at, payload")
      .eq("device_id", device.id)
      .order("recorded_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("export: error leyendo lecturas:", error.message);
      return json(500, { error: "No se pudieron leer las lecturas" });
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  if (rows.length === 0) {
    return json(404, { error: "Este dispositivo aún no tiene lecturas" });
  }

  const { error: quotaError } = await supabase.rpc("register_export", {
    p_device_id: device.id,
    p_row_count: rows.length,
  });
  if (quotaError) {
    if (quotaError.message.includes("Límite de exportaciones")) {
      return json(429, { error: quotaError.message });
    }
    console.error("export: error registrando la exportación:", quotaError.message);
    return json(500, { error: "No se pudo registrar la exportación" });
  }

  const metricLabel =
    METRIC_CATALOG.find((m) => m.key === device.metric_key)?.label ?? device.metric_key ?? "";
  const name = csvText(device.name);
  const key = csvText(device.device_key);
  const metric = csvText(metricLabel);
  const unit = csvText(device.unit ?? "");

  const lines = [
    "fecha_hora_bogota,fecha_hora_utc,dispositivo,device_key,metrica,valor,unidad",
    ...rows.map((row) => {
      const date = new Date(row.recorded_at);
      const value = getMetricValue(row.payload, device.metric_key);
      return [
        bogotaFormat.format(date),
        date.toISOString(),
        name,
        key,
        metric,
        value === null ? "" : String(value),
        unit,
      ].join(",");
    }),
  ];

  // El "﻿" inicial (BOM) le dice a Excel que el archivo está en UTF-8;
  // sin él, las tildes y el "°" de °C salen como caracteres raros.
  const csv = "﻿" + lines.join("\r\n") + "\r\n";
  const today = bogotaFormat.format(new Date()).slice(0, 10);
  const safeKey = device.device_key.replace(/[^A-Za-z0-9_-]/g, "_");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sema-${safeKey}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
