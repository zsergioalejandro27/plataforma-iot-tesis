"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { DeviceRow } from "@/components/device-row";
import { getDeviceStatus, getDisplayValue } from "@/lib/device-status";

type LastTelemetry = {
  payload: unknown;
  recorded_at: string;
} | null;

export type DeviceWithTelemetry = {
  id: string;
  name: string;
  device_key: string;
  metric_key: string | null;
  unit: string | null;
  lastTelemetry: LastTelemetry;
};

export function DeviceList({
  initialDevices,
}: {
  initialDevices: DeviceWithTelemetry[];
}) {
  const [devices, setDevices] = useState(initialDevices);

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    // Hay que esperar a que la sesión termine de cargarse ANTES de
    // suscribirse: si el canal se abre primero, se conecta sin saber
    // quién es el usuario y RLS no le reenvía ningún evento.
    supabase.auth.getSession().then(() => {
      if (cancelled) return;

      channel = supabase
        .channel("telemetry-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "telemetry" },
          (payload) => {
            const newRow = payload.new as {
              device_id: string;
              payload: unknown;
              recorded_at: string;
            };

            setDevices((current) =>
              current.map((device) =>
                device.id === newRow.device_id
                  ? {
                      ...device,
                      lastTelemetry: {
                        payload: newRow.payload,
                        recorded_at: newRow.recorded_at,
                      },
                    }
                  : device,
              ),
            );
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (devices.length === 0) {
    return (
      <p className="p-5 text-sm text-muted2">
        Aún no tienes dispositivos registrados.
      </p>
    );
  }

  return (
    <>
      {devices.map((device) => {
        const status = getDeviceStatus(device.lastTelemetry?.recorded_at ?? null);
        const displayValue = getDisplayValue(
          device.lastTelemetry?.payload,
          device.metric_key,
          device.unit,
        );

        return (
          <DeviceRow
            key={device.id}
            name={device.name}
            deviceKey={device.device_key}
            statusLabel={status.label}
            statusColorClass={status.colorClass}
            value={displayValue}
          />
        );
      })}
    </>
  );
}
