interface DeviceRowProps {
  name: string;
  deviceKey: string;
  statusLabel: string;
  statusColorClass: string;
  value: string;
  // Color elegido para el dispositivo y su ubicación; opcionales porque la
  // vista previa de la landing no los tiene.
  color?: string;
  location?: string | null;
}

export function DeviceRow({
  name,
  deviceKey,
  statusLabel,
  statusColorClass,
  value,
  color,
  location,
}: DeviceRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-line last:border-b-0 px-5 py-4">
      <div className={`h-10 w-1 rounded-full ${statusColorClass}`} />
      <div className="flex-1">
        <p className="flex items-center gap-2 font-medium text-panel-ink">
          {color && (
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
          )}
          {name}
        </p>
        <p className="text-sm text-muted2">
          {location ? `${location} · ` : ""}
          {deviceKey} · {statusLabel}
        </p>
      </div>
      <div className="font-mono text-lg text-panel-ink">{value}</div>
    </div>
  );
}