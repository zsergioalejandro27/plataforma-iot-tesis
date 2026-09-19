export type MetricOption = {
  key: string;
  label: string;
  unit: string;
};

export const METRIC_CATALOG: MetricOption[] = [
  { key: "temperatura", label: "Temperatura", unit: "°C" },
  { key: "humedad", label: "Humedad", unit: "%" },
  { key: "presion", label: "Presión atmosférica", unit: "hPa" },
  { key: "nivel", label: "Nivel", unit: "%" },
  { key: "luminosidad", label: "Luminosidad", unit: "lux" },
  { key: "ruido", label: "Ruido", unit: "dB" },
  { key: "co2", label: "Calidad del aire (CO2)", unit: "ppm" },
  { key: "viento", label: "Velocidad del viento", unit: "m/s" },
  { key: "voltaje", label: "Voltaje", unit: "V" },
  { key: "bateria", label: "Batería", unit: "%" },
];
