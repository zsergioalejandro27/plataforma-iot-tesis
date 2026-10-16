import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeviceList } from "@/components/device-list";
import { AssistantCard } from "@/components/assistant-card";
import { Button } from "@/components/ui/button";
import { getMetricValue } from "@/lib/device-status";
import {
  buildReport,
  typicalIntervalMs,
  type InsightDevice,
  type InsightReading,
} from "@/lib/insights";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }
  const userId = authData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(name, plans(max_readings_per_device))")
    .eq("id", userId)
    .single();

  const tenant = profile?.tenants as {
    name?: string;
    plans?: { max_readings_per_device?: number } | null;
  } | null;
  const tenantName = tenant?.name ?? "Tu organización";
  const maxPerDay = tenant?.plans?.max_readings_per_device ?? null;

  const { data: devices } = await supabase
    .from("devices")
    .select("id, name, device_key, metric_key, unit, color, location")
    .order("created_at", { ascending: true });

  // Una sola consulta con las lecturas de las últimas 24 h de todos los
  // dispositivos (la misma ventana del límite diario del plan). Con el tope
  // del plan Pro (10 dispositivos x 50 lecturas) son como mucho 500 filas.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("telemetry")
    .select("device_id, payload, recorded_at")
    .gte("recorded_at", since)
    .order("recorded_at", { ascending: true })
    .limit(1000);

  const recentByDevice = new Map<string, { payload: unknown; recorded_at: string }[]>();
  for (const row of recent ?? []) {
    const list = recentByDevice.get(row.device_id) ?? [];
    list.push({ payload: row.payload, recorded_at: row.recorded_at });
    recentByDevice.set(row.device_id, list);
  }

  const devicesWithTelemetry = await Promise.all(
    (devices ?? []).map(async (device) => {
      const { data: lastTelemetry } = await supabase
        .from("telemetry")
        .select("payload, recorded_at")
        .eq("device_id", device.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const rows = recentByDevice.get(device.id) ?? [];
      return {
        ...device,
        lastTelemetry,
        // Cada cuánto suele enviar: sirve para decidir si está "en línea".
        typicalIntervalMs: typicalIntervalMs(rows.map((row) => row.recorded_at)),
      };
    })
  );

  // Lo que necesita Semita para generar sus observaciones.
  const insightDevices: InsightDevice[] = devicesWithTelemetry.map((device) => {
    const rows = recentByDevice.get(device.id) ?? [];
    const readings: InsightReading[] = [];
    for (const row of rows) {
      const value = getMetricValue(row.payload, device.metric_key);
      if (value !== null) readings.push({ value, recordedAt: row.recorded_at });
    }
    return {
      id: device.id,
      name: device.name,
      location: device.location,
      metricKey: device.metric_key,
      unit: device.unit,
      readings,
      lastReadingAt: device.lastTelemetry?.recorded_at ?? null,
      readingsCount24h: rows.length,
      maxPerDay,
    };
  });
  const report = buildReport(insightDevices);

  return (
    <>
      <div className="rounded-lg border border-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-panel-ink">Dispositivos</h1>
            <p className="break-words text-sm text-muted2">{tenantName}</p>
          </div>
          <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href="/protected/devices/new">+ Agregar dispositivo</Link>
          </Button>
        </div>

        <DeviceList initialDevices={devicesWithTelemetry} />
      </div>

      <AssistantCard report={report} />
    </>
  );
}
