import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { SignalGraphic } from "@/components/landing/signal-graphic";
import { HeroPreview } from "@/components/landing/hero-preview";
import { HowItWorks } from "@/components/landing/how-it-works";
import { hasEnvVars } from "@/lib/utils";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="bg-panel-ink px-5 py-16 lg:py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-lg flex-col gap-6 text-center lg:text-left">
            <span className="font-mono text-sm text-panel-surface/80">
              plataforma-iot
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-panel-surface lg:text-4xl">
              Plataforma IoT modular y multi-tenant
            </h1>
            <SignalGraphic className="mx-auto h-16 w-full max-w-xs text-live lg:mx-0" />
            <p className="text-sm leading-relaxed text-panel-surface/90">
              Conecta dispositivos, procesa sus datos por MQTT y visualízalos
              en tiempo real — con los datos de cada organización
              completamente aislados entre sí.
            </p>
            <div className="flex justify-center gap-3 lg:justify-start">
              {hasEnvVars ? (
                <>
                  <Button
                    asChild
                    variant="outline"
                    className="border-panel-surface/30 bg-transparent text-panel-surface hover:bg-panel-surface/10 hover:text-panel-surface"
                  >
                    <Link href="/auth/login">Iniciar sesión</Link>
                  </Button>
                  <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                    <Link href="/auth/sign-up">Registrarse</Link>
                  </Button>
                </>
              ) : (
                <EnvVarWarning />
              )}
            </div>
          </div>

          <HeroPreview />
        </div>
      </section>

      <HowItWorks />

      <footer className="border-t border-line bg-panel-surface px-5 py-8 text-center text-xs text-muted2">
        Plataforma IoT — Proyecto de Grado, Ingeniería de Sistemas, UNAB
      </footer>
    </main>
  );
}
