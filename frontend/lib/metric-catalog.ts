export type MetricOption = {
  key: string;
  label: string;
  unit: string;
  // Rango típico y decimales, iguales a los de simulator/payload_generator.py.
  // Los usan los scripts de simulación descargables (lib/device-scripts.ts).
  min: number;
  max: number;
  decimals: number;
};

export const METRIC_CATALOG: MetricOption[] = [
  { key: "temperatura", label: "Temperatura", unit: "°C", min: 18, max: 30, decimals: 1 },
  { key: "humedad", label: "Humedad", unit: "%", min: 30, max: 80, decimals: 1 },
  { key: "presion", label: "Presión atmosférica", unit: "hPa", min: 990, max: 1030, decimals: 1 },
  { key: "nivel", label: "Nivel", unit: "%", min: 0, max: 100, decimals: 1 },
  { key: "luminosidad", label: "Luminosidad", unit: "lux", min: 0, max: 1000, decimals: 1 },
  { key: "ruido", label: "Ruido", unit: "dB", min: 30, max: 90, decimals: 1 },
  { key: "co2", label: "Calidad del aire (CO2)", unit: "ppm", min: 400, max: 2000, decimals: 1 },
  { key: "viento", label: "Velocidad del viento", unit: "m/s", min: 0, max: 20, decimals: 1 },
  { key: "voltaje", label: "Voltaje", unit: "V", min: 3, max: 12, decimals: 2 },
  { key: "bateria", label: "Batería", unit: "%", min: 0, max: 100, decimals: 1 },
];
