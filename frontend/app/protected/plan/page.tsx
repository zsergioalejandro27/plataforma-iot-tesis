import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlanOverview } from "@/components/plan-overview";

export default async function PlanPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }
  const userId = authData.claims.sub;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenants(id, name, plan_id)")
    .eq("id", userId)
    .single();

  const tenant = profile?.tenants as {
    id?: string;
    name?: string;
    plan_id?: string;
  } | null;

  const { data: plans } = await supabase
    .from("plans")
    .select("id, name, max_devices, max_readings_per_device")
    .order("max_devices", { ascending: true });

  const { data: devices } = await supabase
    .from("devices")
    .select("id, name")
    .order("created_at", { ascending: true });

  const devicesWithUsage = await Promise.all(
    (devices ?? []).map(async (device) => {
      const { count } = await supabase
        .from("telemetry")
        .select("*", { count: "exact", head: true })
        .eq("device_id", device.id);

      return { ...device, readingsUsed: count ?? 0 };
    }),
  );

  return (
    <PlanOverview
      tenantId={tenant?.id ?? ""}
      currentPlanId={tenant?.plan_id ?? "basico"}
      plans={plans ?? []}
      devices={devicesWithUsage}
      deviceCount={devices?.length ?? 0}
    />
  );
}
