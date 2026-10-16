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
    <div className="flex items-center gap-3 border-b border-line last:border-b-0 px-4 py-4 sm:gap-4 sm:px-5">
      <div className={`h-10 w-1 shrink-0 rounded-full ${statusColorClass}`} />
      {/* min-w-0: deja que el texto largo se parta en vez de empujar el valor. */}
      <div className="min-w-0 flex-1">
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
      <div className="shrink-0 font-mono text-base text-panel-ink sm:text-lg">{value}</div>
    </div>
  );
}