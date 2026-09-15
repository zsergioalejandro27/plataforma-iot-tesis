import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeviceRow } from "@/components/device-row";


function getDeviceStatus(lastRecordedAt: string | null) {
  if (!lastRecordedAt) {
    return { label: "sin datos", colorClass: "bg-line" };
  }

  const diffMinutes = (Date.now() - new Date(lastRecordedAt).getTime()) / 1000 / 60;

  if (diffMinutes < 10) {
    return { label: "en línea", colorClass: "bg-brand" };
  }
  if (diffMinutes < 60) {
    return { label: `sin señal hace ${Math.round(diffMinutes)}min`, colorClass: "bg-line" };
  }
  const diffHours = Math.round(diffMinutes / 60);
  return { label: `sin señal hace ${diffHours}h`, colorClass: "bg-line" };
}

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }
  const userId = authData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(name)")
    .eq("id", userId)
    .single();

  const tenantName = (profile?.tenants as { name?: string } | null)?.name ?? "Tu organización";

  const { data: devices } = await supabase
    .from("devices")
    .select("id, name, device_key, metric_key, unit")
    .order("created_at", { ascending: true });

  const devicesWithTelemetry = await Promise.all(
    (devices ?? []).map(async (device) => {
      const { data: lastTelemetry } = await supabase
        .from("telemetry")
        .select("payload, recorded_at")
        .eq("device_id", device.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { ...device, lastTelemetry };
    })
  );

  return (
    <div className="rounded-lg border border-line bg-white">
      <div className="border-b border-line p-5">
        <h1 className="text-xl font-semibold text-panel-ink">Dispositivos</h1>
        <p className="text-sm text-muted2">{tenantName}</p>
      </div>

      {devicesWithTelemetry.length === 0 ? (
        <p className="p-5 text-sm text-muted2">
          Aún no tienes dispositivos registrados.
        </p>
      ) : (
        devicesWithTelemetry.map((device) => {
          const status = getDeviceStatus(device.lastTelemetry?.recorded_at ?? null);
          const payload = device.lastTelemetry?.payload as Record<string, unknown> | undefined;
          const rawValue = device.metric_key && payload ? payload[device.metric_key] : undefined;
          const displayValue = rawValue !== undefined ? `${rawValue}${device.unit ?? ""}` : "—";

          return (
            <DeviceRow
              key={device.id}
              name={device.name}
              deviceKey={device.device_key}
              statusLabel={status.label}
              statusColorClass={status.colorClass}
              value={displayValue}
            />
          );
        })
      )}
    </div>
  );
}