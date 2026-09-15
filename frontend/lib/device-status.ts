export type DeviceStatus = {
  label: string;
  colorClass: string;
};

export function getDeviceStatus(lastRecordedAt: string | null): DeviceStatus {
  if (!lastRecordedAt) {
    return { label: "sin datos", colorClass: "bg-line" };
  }

  const diffMinutes = (Date.now() - new Date(lastRecordedAt).getTime()) / 1000 / 60;

  if (diffMinutes < 10) {
    return { label: "en línea", colorClass: "bg-brand" };
  }
  if (diffMinutes < 60) {
    return { label: `sin señal hace ${Math.round(diffMinutes)}min`, colorClass: "bg-line" };
  }
  const diffHours = Math.round(diffMinutes / 60);
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
