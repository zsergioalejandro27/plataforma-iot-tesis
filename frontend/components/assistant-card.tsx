"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SemitaMark } from "@/components/semita-mark";
import type { AssistantReport, Severity } from "@/lib/insights";

// Colores fijos por gravedad (no cambian con el acento de la organización:
// significan un estado).
const STYLES: Record<Severity, { box: string; icon: string; Icon: typeof Info }> = {
  alerta: { box: "bg-red-50 text-red-900", icon: "text-red-600", Icon: AlertCircle },
  atencion: { box: "bg-amber-50 text-amber-950", icon: "text-amber-600", Icon: AlertTriangle },
  aviso: { box: "bg-panel-surface text-panel-ink", icon: "text-muted2", Icon: Info },
  ok: { box: "bg-online/10 text-panel-ink", icon: "text-online", Icon: CheckCircle2 },
};

// Tarjeta de Semita, debajo de la lista de dispositivos. El informe lo calcula
// el servidor (lib/insights.ts) al cargar la página; "Actualizar" lo recalcula.
export function AssistantCard({ report }: { report: AssistantReport }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // router.refresh no devuelve una promesa que indique cuándo termina.
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <section
      aria-label="Observaciones de Semita"
      className="mt-6 rounded-lg border border-line bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-panel-ink">
            <SemitaMark className="h-7 w-7 text-live" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-panel-ink">Semita</h2>
            <p className="text-xs text-muted2">Asistente de Sema</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={refresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <p className="text-sm text-panel-ink">
          <span className="font-medium">Hola, soy Semita. </span>
          {report.summary}
        </p>

        {report.insights.length > 0 && (
          <ul className="flex flex-col gap-2">
            {report.insights.map((insight) => {
              const { box, icon, Icon } = STYLES[insight.severity];
              const content = (
                <div className={`flex items-start gap-3 rounded-md p-3 ${box}`}>
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${icon}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium">{insight.title}</p>
                    <p className="mt-0.5 break-words text-xs opacity-90">{insight.detail}</p>
                  </div>
                </div>
              );
              return (
                <li key={insight.id}>
                  {insight.deviceId ? (
                    <Link
                      href={`/protected/devices/${insight.deviceId}`}
                      className="block transition-opacity hover:opacity-80"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-xs text-muted2">
          Observaciones automáticas basadas en reglas, con valores de referencia
          orientativos.
        </p>
      </div>
    </section>
  );
}
