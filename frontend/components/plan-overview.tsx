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
};

type DeviceUsage = {
  id: string;
  name: string;
  readingsUsed: number;
};

export function PlanOverview({
  tenantId,
  currentPlanId,
  plans,
  devices,
  deviceCount,
}: {
  tenantId: string;
  currentPlanId: string;
  plans: Plan[];
  devices: DeviceUsage[];
  deviceCount: number;
}) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlan = plans.find((p) => p.id === currentPlanId);

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
        <Link href="/protected" className="text-sm text-muted2 hover:text-panel-ink">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-panel-ink">Tu plan</h1>
        <p className="mt-1 text-sm text-muted2">
          Cada plan define cuántos dispositivos puedes registrar y cuántas
          lecturas puede recibir cada uno.
        </p>
      </div>

      {currentPlan && (
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm text-muted2">Plan actual</p>
          <p className="text-lg font-semibold text-panel-ink">{currentPlan.name}</p>
          <p className="mt-1 text-sm text-muted2">
            {deviceCount} de {currentPlan.max_devices} dispositivos usados
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border p-4 ${
              plan.id === currentPlanId
                ? "border-brand bg-brand/5"
                : "border-line bg-white"
            }`}
          >
            <p className="font-semibold text-panel-ink">{plan.name}</p>
            <p className="mt-2 text-sm text-muted2">{plan.max_devices} dispositivos</p>
            <p className="text-sm text-muted2">
              {plan.max_readings_per_device} lecturas por dispositivo
            </p>
            <Button
              className="mt-4 w-full bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={plan.id === currentPlanId || selecting !== null}
              onClick={() => handleSelect(plan.id)}
            >
              {plan.id === currentPlanId
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
            <p className="font-medium text-panel-ink">Uso por dispositivo</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-muted2">
                <th className="px-4 py-2 font-medium">Dispositivo</th>
                <th className="px-4 py-2 font-medium">Lecturas usadas</th>
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
