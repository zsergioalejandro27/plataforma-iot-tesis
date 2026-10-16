import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayValue, getMetricValue } from "@/lib/device-status";
import { colorForDevice } from "@/lib/palette";
import { DeviceCustomize } from "@/components/device-customize";
import { TelemetryChart } from "@/components/telemetry-chart";
import { DeleteDeviceButton } from "@/components/delete-device-button";
import { DeviceConnect } from "@/components/device-connect";
import { DeviceTabs } from "@/components/device-tabs";

export default async function DeviceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }
  const userId = authData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenants(name, time_format, plans(max_readings_per_device))")
    .eq("id", userId)
    .single();

  const tenant = profile?.tenants as {
    name?: string;
    time_format?: string | null;
    plans?: { max_readings_per_device?: number } | null;
  } | null;
  const tenantName = tenant?.name ?? "Tu organización";
  // Formato de hora que eligió la organización (12 horas por defecto).
  const hour12 = tenant?.time_format !== "24h";
  const maxPerDay = tenant?.plans?.max_readings_per_device ?? null;

  const { data: device } = await supabase
    .from("devices")
    .select(
      "id, name, device_key, metric_key, unit, api_token, cloud_simulation, color, location, chart_type",
    )
    .eq("id", id)
    .single();

  if (!device) {
    notFound();
  }

  const { data: telemetry } = await supabase
    .from("telemetry")
    .select("id, payload, recorded_at")
    .eq("device_id", device.id)
    .order("recorded_at", { ascending: false })
    .limit(200);

  // Todo se formatea con timeZone explícito: este código corre en el servidor
  // de Vercel (UTC), no en el navegador de Bogotá.
  const TZ = "America/Bogota";
  const deviceColor = colorForDevice(device.id, device.color);
  const chartData = (telemetry ?? [])
    .slice()
    .reverse()
    .map((row) => {
      const date = new Date(row.recorded_at);
      const parts = new Intl.DateTimeFormat("es-CO", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: TZ,
      }).formatToParts(date);
      const part = (type: string) =>
        (parts.find((p) => p.type === type)?.value ?? "").replace(".", "");

      return {
        key: `${row.id}`,
        // "2:38 p. m." -> "2:38 pm", más corto para el eje
        time: date
          .toLocaleTimeString("es-CO", {
            hour: "numeric",
            minute: "2-digit",
            hour12,
            timeZone: TZ,
          })
          .replace(/\s*([ap])\.\s*m\./i, " $1m"),
        // "2026-10-14": sirve para detectar en qué punto cambia el día
        day: date.toLocaleDateString("en-CA", { timeZone: TZ }),
        dayLabel: `${part("weekday")} ${part("day")} ${part("month")}`,
        full: date.toLocaleString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12,
          timeZone: TZ,
        }),
        value: getMetricValue(row.payload, device.metric_key) ?? 0,
      };
    });

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div className="min-w-0">
          <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
            ← Volver
          </Link>
          <h1 className="mt-2 break-words text-xl font-semibold text-panel-ink">{device.name}</h1>
          <p className="break-words text-sm text-muted2">
            {device.location ? `${device.location} · ` : ""}
            {device.device_key} · {tenantName}
          </p>
        </div>
        <DeleteDeviceButton deviceId={device.id} deviceName={device.name} />
      </div>

      <DeviceTabs
        defaultTab={created === "1" ? "conectar" : "lecturas"}
        readings={
          !telemetry || telemetry.length === 0 ? (
            <p className="p-5 text-sm text-muted2">
              Aún no hay lecturas registradas para este dispositivo.
            </p>
          ) : (
            <>
              <TelemetryChart
                data={chartData}
                unit={device.unit}
                color={deviceColor}
                deviceId={device.id}
                initialChartType={
                  device.chart_type === "bar" || device.chart_type === "scatter"
                    ? device.chart_type
                    : "line"
                }
              />
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted2">
                    <th className="px-3 py-3 font-medium sm:px-5">Fecha y hora</th>
                    <th className="px-3 py-3 font-medium sm:px-5">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetry.slice(0, 50).map((row) => (
                    <tr key={row.id} className="border-b border-line last:border-b-0">
                      <td className="px-3 py-3 text-panel-ink sm:px-5">
                        {new Date(row.recorded_at).toLocaleString("es-CO", {
                          hour12,
                          timeZone: "America/Bogota",
                        })}
                      </td>
                      <td className="px-3 py-3 font-mono text-panel-ink sm:px-5">
                        {getDisplayValue(row.payload, device.metric_key, device.unit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        }
        connect={
          <DeviceConnect
            deviceId={device.id}
            deviceName={device.name}
            deviceKey={device.device_key}
            metricKey={device.metric_key}
            unit={device.unit}
            initialToken={device.api_token}
            initialCloudSimulation={device.cloud_simulation}
            maxPerDay={maxPerDay}
            justCreated={created === "1"}
          />
        }
        customize={
          <DeviceCustomize
            deviceId={device.id}
            initialName={device.name}
            initialLocation={device.location}
            initialColor={deviceColor}
          />
        }
      />
    </div>
  );
}
