import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDisplayValue, getMetricValue } from "@/lib/device-status";
import { TelemetryChart } from "@/components/telemetry-chart";
import { DeleteDeviceButton } from "@/components/delete-device-button";

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
    .select("tenants(name)")
    .eq("id", userId)
    .single();

  const tenantName = (profile?.tenants as { name?: string } | null)?.name ?? "Tu organización";

  const { data: device } = await supabase
    .from("devices")
    .select("id, name, device_key, metric_key, unit")
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
    .limit(50);

  const chartData = (telemetry ?? [])
    .slice()
    .reverse()
    .map((row) => ({
      time: new Date(row.recorded_at).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      value: getMetricValue(row.payload, device.metric_key) ?? 0,
    }));

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="flex items-start justify-between border-b border-line p-5">
        <div>
          <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
            ← Volver
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-panel-ink">{device.name}</h1>
          <p className="text-sm text-muted2">
            {device.device_key} · {tenantName}
          </p>
        </div>
        <DeleteDeviceButton deviceId={device.id} deviceName={device.name} />
      </div>

      {created === "1" && (
        <div className="border-b border-line bg-brand/10 p-4 text-sm">
          <p className="font-medium text-panel-ink">¡Dispositivo creado!</p>
          <p className="mt-1 text-muted2">
            Usa esta clave para simularlo:{" "}
            <code className="font-mono text-panel-ink">{device.device_key}</code>
          </p>
          <p className="mt-1 font-mono text-xs text-muted2">
            py simulator/publish_test.py {device.device_key}
          </p>
        </div>
      )}

      {!telemetry || telemetry.length === 0 ? (
        <p className="p-5 text-sm text-muted2">
          Aún no hay lecturas registradas para este dispositivo.
        </p>
      ) : (
        <>
          <TelemetryChart data={chartData} unit={device.unit} />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted2">
                <th className="px-5 py-3 font-medium">Fecha y hora</th>
                <th className="px-5 py-3 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 text-panel-ink">
                    {new Date(row.recorded_at).toLocaleString("es-CO")}
                  </td>
                  <td className="px-5 py-3 font-mono text-panel-ink">
                    {getDisplayValue(row.payload, device.metric_key, device.unit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
