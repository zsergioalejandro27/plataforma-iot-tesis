import { SignalGraphic } from "@/components/landing/signal-graphic";
import { SemaLogo } from "@/components/sema-logo";

export function AuthSidePanel() {
  return (
    <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-panel-ink p-10 lg:p-16">
      <SemaLogo />

      <SignalGraphic className="w-full max-w-md text-live" />

      <p className="max-w-sm text-sm leading-relaxed text-panel-surface/90">
        Monitorea dispositivos y datos de tus organizaciones en tiempo real,
        con los datos de cada cliente completamente aislados.
      </p>
    </div>
  );
}