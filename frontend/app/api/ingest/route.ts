import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Puerta HTTP para dispositivos y scripts externos (alternativa al camino MQTT).
// El dispositivo se identifica con su token secreto (devices.api_token), así
// que quien envía no necesita ninguna credencial de HiveMQ ni de Supabase.
//
// POST /api/ingest
//   Authorization: Bearer <api_token del dispositivo>
//   Content-Type: application/json
//   {"temperatura": 22.5}
export const runtime = "nodejs";

const MAX_BODY_BYTES = 2048;
const TOKEN_FORMAT = /^[A-Za-z0-9_-]{16,128}$/;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

// Mismo mensaje para "sin token" y "token que no existe": así no se revela
// qué tokens son válidos.
const unauthorized = () => json(401, { error: "Token inválido o ausente" });

export async function POST(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token || !TOKEN_FORMAT.test(token)) {
    return unauthorized();
  }

  let supabase;
  try {
    supabase = createAdminClient();
  } catch (error) {
    console.error("ingest: configuración incompleta:", (error as Error).message);
    return json(500, { error: "Error de configuración del servidor" });
  }

  const { data: device, error: lookupError } = await supabase
    .from("devices")
    .select("id, tenant_id, metric_key")
    .eq("api_token", token)
    .maybeSingle();

  if (lookupError) {
    console.error("ingest: error buscando el dispositivo:", lookupError.message);
    return json(500, { error: "Error interno" });
  }
  if (!device) {
    return unauthorized();
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json(413, { error: `El cuerpo supera ${MAX_BODY_BYTES} bytes` });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: "El cuerpo no es un JSON válido" });
  }
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return json(400, { error: "El cuerpo debe ser un objeto JSON" });
  }

  if (device.metric_key) {
    const value = (payload as Record<string, unknown>)[device.metric_key];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return json(400, {
        error: `Falta el campo numérico "${device.metric_key}"`,
      });
    }
  }

  // Los triggers de límite (enforce_reading_limit) también aplican aquí.
  const { error: insertError } = await supabase.from("telemetry").insert({
    tenant_id: device.tenant_id,
    device_id: device.id,
    payload,
  });

  if (insertError) {
    if (insertError.message.includes("Límite de lecturas")) {
      return json(429, { error: insertError.message });
    }
    console.error("ingest: error insertando la lectura:", insertError.message);
    return json(500, { error: "Error interno" });
  }

  return json(201, { ok: true });
}
