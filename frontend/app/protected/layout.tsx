import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { SemaLogo } from "@/components/sema-logo";
import { createClient } from "@/lib/supabase/server";
import { hexToRgbTriplet, isValidHex } from "@/lib/palette";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Color de acento de la organización: se lee aquí y se aplica como la
  // variable CSS --brand-rgb en todo /protected. Si no eligió ninguno (o el
  // valor no es un hex válido) se queda el verde por defecto de globals.css.
  let accent: string | null = null;
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getClaims();
    const userId = authData?.claims?.sub;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenants(accent_color)")
        .eq("id", userId)
        .single();
      accent =
        (profile?.tenants as { accent_color?: string | null } | null)?.accent_color ?? null;
    }
  }
  const accentStyle = isValidHex(accent)
    ? ({ "--brand-rgb": hexToRgbTriplet(accent) } as React.CSSProperties)
    : undefined;

  return (
    <main className="min-h-screen flex flex-col bg-panel-surface" style={accentStyle}>
      <nav className="w-full bg-panel-ink">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-4 px-5">
          <div className="flex items-center gap-5">
            <Link href="/protected" aria-label="Sema, inicio" className="flex items-center">
              <SemaLogo variant="compact" />
            </Link>
            <Link
              href="/protected/plan"
              className="text-sm text-panel-surface/80 hover:text-panel-surface"
            >
              Plan
            </Link>
            <Link
              href="/protected/settings"
              className="text-sm text-panel-surface/80 hover:text-panel-surface"
            >
              Personalizar
            </Link>
          </div>
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </nav>
      <div className="flex-1 w-full max-w-5xl mx-auto p-5">{children}</div>
    </main>
  );
}
