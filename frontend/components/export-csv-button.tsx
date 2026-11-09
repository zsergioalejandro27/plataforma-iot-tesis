"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Franja "Exportar CSV" de la pestaña Lecturas. El cupo (cuántas quedan y
// cuándo vuelve a haber) lo calcula el servidor en devices/[id]/page.tsx;
// después de descargar se hace router.refresh() para que lo recalcule.
// La pestaña no pierde su estado con el refresh.
export function ExportCsvButton({
  deviceId,
  remaining,
  max,
  nextAvailableLabel,
}: {
  deviceId: string;
  remaining: number;
  max: number;
  nextAvailableLabel: string | null;
}) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      const res = await fetch(`/api/export/${deviceId}`, { cache: "no-store" });
      const type = res.headers.get("content-type") ?? "";

      if (!res.ok || !type.includes("text/csv")) {
        const body = type.includes("application/json") ? await res.json() : null;
        setError(body?.error ?? "No se pudo exportar. Intenta de nuevo.");
        return;
      }

      // Se descarga con un enlace temporal: así se puede mostrar el error
      // en la página (con un <a href> directo se abriría una pestaña con JSON).
      const blob = await res.blob();
      const fileName =
        res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "lecturas.csv";
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsExporting(false);
      router.refresh();
    }
  };

  const noneLeft = remaining <= 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
      <div className="min-w-0 text-sm">
        <p className="text-panel-ink">Exportar todas las lecturas a CSV</p>
        <p className="text-muted2">
          {noneLeft
            ? `Ya usaste ${max === 1 ? "la exportación" : `las ${max} exportaciones`} de hoy.${
                nextAvailableLabel ? ` Vuelve a estar disponible ${nextAvailableLabel}.` : ""
              }`
            : `Te ${remaining === 1 ? "queda" : "quedan"} ${remaining} de ${max} hoy · se abre en Excel o Google Sheets.`}
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <Button
        size="sm"
        className="bg-brand text-brand-foreground hover:bg-brand/90"
        onClick={handleExport}
        disabled={isExporting || noneLeft}
      >
        {isExporting ? "Exportando..." : "Exportar CSV"}
      </Button>
    </div>
  );
}
