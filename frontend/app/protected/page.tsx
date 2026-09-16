import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DeviceList } from "@/components/device-list";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center justify-between border-b border-line p-5">
        <div>
          <h1 className="text-xl font-semibold text-panel-ink">Dispositivos</h1>
          <p className="text-sm text-muted2">{tenantName}</p>
        </div>
        <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/protected/devices/new">+ Agregar dispositivo</Link>
        </Button>
      </div>

      <DeviceList initialDevices={devicesWithTelemetry} />
    </div>
  );
}