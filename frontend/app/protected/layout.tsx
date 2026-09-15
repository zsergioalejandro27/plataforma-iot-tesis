import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-panel-surface">
      <nav className="w-full bg-panel-ink">
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center p-4 px-5">
          <Link href="/protected" className="font-mono text-sm text-panel-surface">
            plataforma-iot
          </Link>
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