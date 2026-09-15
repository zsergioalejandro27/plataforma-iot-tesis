interface DeviceRowProps {
  name: string;
  deviceKey: string;
  statusLabel: string;
  statusColorClass: string;
  value: string;
}

export function DeviceRow({
  name,
  deviceKey,
  statusLabel,
  statusColorClass,
  value,
}: DeviceRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-line last:border-b-0 px-5 py-4">
      <div className={`h-10 w-1 rounded-full ${statusColorClass}`} />
      <div className="flex-1">
        <p className="font-medium text-panel-ink">{name}</p>
        <p className="text-sm text-muted2">
          {deviceKey} · {statusLabel}
        </p>
      </div>
      <div className="font-mono text-lg text-panel-ink">{value}</div>
    </div>
  );
}