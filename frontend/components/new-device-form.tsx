"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function generateDeviceKey() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `device-${suffix}`;
}

export function NewDeviceForm() {
  const [name, setName] = useState("");
  const [metricKey, setMetricKey] = useState("");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    let lastError: string | null = "No se pudo crear el dispositivo";

    // Reintenta unas pocas veces por si el device_key generado ya existe
    // (choca con la restricción UNIQUE) — muy poco probable, pero posible.
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabase
        .from("devices")
        .insert({
          name,
          metric_key: metricKey || null,
          unit: unit || null,
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
            <Input
              id="metric_key"
              placeholder="temperatura, humedad, nivel, presion..."
              required
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
            <p className="text-xs text-muted2">
              El nombre del campo dentro del payload MQTT que quieres mostrar
              en el dashboard.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="unit" className="text-panel-ink">
              Unidad
            </Label>
            <Input
              id="unit"
              placeholder="°C, %, hPa..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="border-line bg-white text-panel-ink placeholder:text-muted2"
            />
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
