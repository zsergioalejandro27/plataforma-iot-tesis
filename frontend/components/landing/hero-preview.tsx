import { DeviceRow } from "@/components/device-row";
import { TelemetryChart } from "@/components/telemetry-chart";

const sampleChartData = [
  { time: "08:00", value: 21.4 },
  { time: "09:00", value: 22.1 },
  { time: "10:00", value: 21.8 },
  { time: "11:00", value: 23.2 },
  { time: "12:00", value: 24.6 },
  { time: "13:00", value: 23.9 },
  { time: "14:00", value: 22.7 },
];

export function HeroPreview() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-lg border border-line bg-white shadow-xl">
      <div className="border-b border-line p-4">
        <p className="text-sm font-semibold text-panel-ink">Dispositivos</p>
        <p className="text-xs text-muted2">Organización de ejemplo</p>
      </div>

      <TelemetryChart data={sampleChartData} unit="°C" />

      <div>
        <DeviceRow
          name="Sensor Temperatura 1"
          deviceKey="device-001"
          statusLabel="en línea"
          statusColorClass="bg-brand"
          value="22.7°C"
        />
        <DeviceRow
          name="Sensor Humedad 1"
          deviceKey="device-002"
          statusLabel="en línea"
          statusColorClass="bg-brand"
          value="58%"
        />
      </div>
    </div>
  );
}
