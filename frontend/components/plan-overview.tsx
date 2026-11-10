"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Plan = {
  id: string;
  name: string;
  max_devices: number;
  max_readings_per_device: number;
  max_exports_per_day: number;
};

type DeviceUsage = {
  id: string;
  name: string;
  readingsUsed: number;
};

export function PlanOverview({
  tenantId,
  currentPlanId,
  planSelected,
  plans,
  devices,
  deviceCount,
  exportsUsed,
}: {
  tenantId: string;
  currentPlanId: string;
  // false = cuenta recién creada que aún no ha elegido plan. La base de datos
  // ya le asigna "basico" por defecto, así que no se puede tratar ese plan como
  // "actual" (su botón quedaría desactivado y el proxy no la deja salir de aquí).
  planSelected: boolean;
  plans: Plan[];
  devices: DeviceUsage[];
  deviceCount: number;
  exportsUsed: number;
}) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = planSelected
    ? plans.find((p) => p.id === currentPlanId)
    : undefined;
  const isCurrent = (planId: string) => planSelected && planId === currentPlanId;

  const handleSelect = async (planId: string) => {
    setSelecting(planId);
    setError(null);
    const supabase = createClient();

    const { error } = await supabase
      .from("tenants")
      .update({ plan_id: planId, plan_selected: true })
      .eq("id", tenantId);

    if (error) {
      setError(error.message);
      setSelecting(null);
      return;
    }

    // Navegación completa (no router.push): así garantizamos que el
    // proxy vuelva a evaluar plan_selected en una petición nueva y no
    // se quede pegado en una transición del lado del cliente.
    window.location.href = "/protected";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        {planSelected && (
          <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
            ← Volver
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-semibold text-panel-ink">
          {planSelected ? "Tu plan" : "Elige tu plan para empezar"}
        </h1>
        <p className="mt-1 text-sm text-muted2">
          Cada plan define cuántos dispositivos puedes registrar, cuántas
          lecturas diarias puede recibir cada uno y cuántas veces al día puedes
          exportar lecturas a CSV.
        </p>
      </div>

      {currentPlan && (
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm text-muted2">Plan actual</p>
          <p className="text-lg font-semibold text-panel-ink">{currentPlan.name}</p>
          <p className="mt-1 text-sm text-muted2">
            {deviceCount} de {currentPlan.max_devices} dispositivos usados
          </p>
          <p className="text-sm text-muted2">
            {Math.min(exportsUsed, currentPlan.max_exports_per_day)} de{" "}
            {currentPlan.max_exports_per_day} exportaciones usadas hoy
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border p-4 ${
              isCurrent(plan.id)
                ? "border-brand bg-brand/5"
                : "border-line bg-white"
            }`}
          >
            <p className="font-semibold text-panel-ink">{plan.name}</p>
            <p className="mt-2 text-sm text-muted2">{plan.max_devices} dispositivos</p>
            <p className="text-sm text-muted2">
              {plan.max_readings_per_device} lecturas diarias por dispositivo
            </p>
            <p className="text-sm text-muted2">
              {plan.max_exports_per_day}{" "}
              {plan.max_exports_per_day === 1 ? "exportación" : "exportaciones"} CSV al día
            </p>
            <Button
              className="mt-4 w-full bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={isCurrent(plan.id) || selecting !== null}
              onClick={() => handleSelect(plan.id)}
            >
              {isCurrent(plan.id)
                ? "Plan actual"
                : selecting === plan.id
                  ? "Cambiando..."
                  : "Elegir este plan"}
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {devices.length > 0 && currentPlan && (
        <div className="rounded-lg border border-line bg-white">
          <div className="border-b border-line p-4">
            <p className="font-medium text-panel-ink">Uso por dispositivo (hoy)</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted2">
                <th className="px-4 py-2 font-medium">Dispositivo</th>
                <th className="px-4 py-2 font-medium">Lecturas hoy</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id} className="border-b border-line last:border-b-0">
                  <td className="px-4 py-2 text-panel-ink">{device.name}</td>
                  <td className="px-4 py-2 text-panel-ink">
                    {device.readingsUsed} / {currentPlan.max_readings_per_device}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
