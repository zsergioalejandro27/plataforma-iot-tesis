import { onlineWindowMs } from "@/lib/insights";

export type DeviceStatus = {
  label: string;
  colorClass: string;
};

// `typicalIntervalMs` es cada cuánto suele enviar este dispositivo (lib/insights.ts).
// Con él, uno que publica cada hora sigue "en línea" a los 58 minutos; sin él
// (dispositivo nuevo, pocas lecturas) se usa la ventana mínima de 10 minutos.
export function getDeviceStatus(
  lastRecordedAt: string | null,
  typicalIntervalMs: number | null = null,
): DeviceStatus {
  if (!lastRecordedAt) {
    return { label: "sin datos", colorClass: "bg-line" };
  }

  const diffMs = Date.now() - new Date(lastRecordedAt).getTime();

  if (diffMs < onlineWindowMs(typicalIntervalMs)) {
    return { label: "en línea", colorClass: "bg-online" };
  }

  const diffMinutes = diffMs / 1000 / 60;
  if (diffMinutes < 60) {
    return { label: `sin señal hace ${Math.round(diffMinutes)}min`, colorClass: "bg-line" };
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours >= 48) {
    return { label: `sin señal hace ${Math.round(diffHours / 24)}d`, colorClass: "bg-line" };
  }
  return { label: `sin señal hace ${diffHours}h`, colorClass: "bg-line" };
}

export function getDisplayValue(
  payload: unknown,
  metricKey: string | null,
  unit: string | null,
): string {
  const payloadObject = payload as Record<string, unknown> | null | undefined;
  const rawValue = metricKey && payloadObject ? payloadObject[metricKey] : undefined;
  return rawValue !== undefined ? `${rawValue}${unit ?? ""}` : "—";
}

export function getMetricValue(payload: unknown, metricKey: string | null): number | null {
  const payloadObject = payload as Record<string, unknown> | null | undefined;
  const rawValue = metricKey && payloadObject ? payloadObject[metricKey] : undefined;
  const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue);
  return rawValue !== undefined && !Number.isNaN(numericValue) ? numericValue : null;
}
