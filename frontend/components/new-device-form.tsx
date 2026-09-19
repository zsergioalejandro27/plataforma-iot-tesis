"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { METRIC_CATALOG } from "@/lib/metric-catalog";

function generateDeviceKey() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `device-${suffix}`;
}

export function NewDeviceForm() {
  const [name, setName] = useState("");
  const [metricKey, setMetricKey] = useState(METRIC_CATALOG[0].key);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    let lastError: string | null = "No se pudo crear el dispositivo";

    const selectedMetric =
      METRIC_CATALOG.find((m) => m.key === metricKey) ?? METRIC_CATALOG[0];

    // Reintenta unas pocas veces por si el device_key generado ya existe
    // (choca con la restricción UNIQUE) — muy poco probable, pero posible.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("devices")
        .insert({
          name,
          metric_key: selectedMetric.key,
          unit: selectedMetric.unit,
          device_key: generateDeviceKey(),
        })
        .select("id")
        .single();

      if (!error && data) {
        router.push(`/protected/devices/${data.id}?created=1`);
        return;
      }

      if (error?.code === "23505") {
        lastError = error.message;
        continue;
      }

      lastError = error?.message ?? lastError;
      break;
    }

    setError(lastError);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-panel-ink">
          Agregar dispositivo
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Registra un dispositivo nuevo en tu organización.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-panel-ink">
              Nombre
            </Label>
            <Input
              id="name"
              placeholder="Sensor Temperatura 2"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="metric_key" className="text-panel-ink">
              Métrica
            </Label>
            <select
              id="metric_key"
              required
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              className="flex h-9 w-full rounded-md border border-line bg-white px-3 py-1 text-base text-panel-ink shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
            >
              {METRIC_CATALOG.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.label} ({metric.unit})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted2">
              La unidad queda fijada automáticamente según la métrica que
              elijas.
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={isLoading}
          >
            {isLoading ? "Creando..." : "Crear dispositivo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
