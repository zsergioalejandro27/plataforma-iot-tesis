"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export type TelemetryPoint = {
  time: string;
  value: number;
};

type ChartType = "line" | "bar" | "scatter";

// Ancho mínimo que se le reserva a cada lectura. Si no cabe en el contenedor,
// la gráfica se ensancha y aparece scroll horizontal en vez de apretarse.
const PX_PER_POINT = 48;

const CHART_OPTIONS: { type: ChartType; label: string }[] = [
  { type: "line", label: "Línea" },
  { type: "bar", label: "Barras" },
  { type: "scatter", label: "Puntos" },
];

export function TelemetryChart({
  data,
  unit,
}: {
  data: TelemetryPoint[];
  unit: string | null;
}) {
  const [chartType, setChartType] = useState<ChartType>("line");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Al cargar (o al llegar lecturas nuevas) el scroll va al extremo derecho,
  // donde están las lecturas más recientes. Se hace en un efecto porque
  // necesita el DOM ya montado.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [data.length, chartType]);

  return (
    <div className="border-b border-line p-5">
      <div className="mb-3 flex w-fit gap-1 rounded-md border border-line p-1">
        {CHART_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setChartType(option.type)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              chartType === option.type
                ? "bg-brand text-brand-foreground"
                : "text-muted2 hover:text-panel-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="overflow-x-auto">
      <div style={{ minWidth: data.length * PX_PER_POINT }}>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#D8D4C9" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#5B6663"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#5B6663"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F7F6F2",
              border: "1px solid #D8D4C9",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#12181B" }}
            formatter={(value) => [`${value}${unit ?? ""}`, "Valor"]}
          />
          {chartType === "line" && (
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2B6E63"
              strokeWidth={2}
              dot={false}
            />
          )}
          {chartType === "bar" && (
            <Bar
              dataKey="value"
              fill="#2B6E63"
              fillOpacity={0.25}
              stroke="#2B6E63"
              strokeWidth={1.5}
              radius={[4, 4, 0, 0]}
            />
          )}
          {chartType === "scatter" && (
            <Scatter
              dataKey="value"
              fill="#2B6E63"
              line={{ stroke: "#2B6E63", strokeWidth: 1 }}
              lineType="joint"
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
}
