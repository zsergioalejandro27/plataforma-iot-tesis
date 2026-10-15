import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OrgSettingsForm } from "@/components/org-settings-form";
import { isValidHex, PALETTE } from "@/lib/palette";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(name, accent_color, time_format)")
    .eq("id", authData.claims.sub)
    .single();

  const tenant = profile?.tenants as {
    name?: string;
    accent_color?: string | null;
    time_format?: string | null;
  } | null;

  if (!profile?.tenant_id || !tenant) {
    redirect("/protected");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-panel-ink">
          Personalizar tu organización
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Estos ajustes se aplican a toda tu organización y no afectan a las demás.
        </p>
      </div>

      <OrgSettingsForm
        tenantId={profile.tenant_id}
        initialName={tenant.name ?? ""}
        initialAccent={isValidHex(tenant.accent_color) ? tenant.accent_color : PALETTE[0].hex}
        initialTimeFormat={tenant.time_format === "24h" ? "24h" : "12h"}
      />
    </div>
  );
}
