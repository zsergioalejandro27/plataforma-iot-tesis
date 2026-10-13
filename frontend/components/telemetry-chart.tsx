"use client";

import { useEffect, useRef, useState } from "react";
import {
  ComposedChart,
  DefaultTooltipContent,
  Line,
  Bar,
  Scatter,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export type TelemetryPoint = {
  // Hora corta que se muestra en el eje, ej. "2:38 pm".
  time: string;
  value: number;
  // Los cuatro campos siguientes son opcionales: la vista previa de la landing
  // usa datos de un solo día y no los trae.
  // Identificador único del punto. Hace falta porque la misma hora puede
  // repetirse en días distintos y Recharts no distingue categorías iguales.
  key?: string;
  // Día en formato "2026-10-14", para detectar dónde cambia el día.
  day?: string;
  // Nombre del día para el encabezado de cada tramo, ej. "mar 14 oct".
  dayLabel?: string;
  // Fecha completa para el tooltip, ej. "martes, 14 de octubre, 2:38 pm".
  full?: string;
};

type ChartType = "line" | "bar" | "scatter";

// Ancho mínimo que se le reserva a cada lectura. Si no cabe en el contenedor,
// la gráfica se ensancha y aparece scroll horizontal en vez de apretarse.
const PX_PER_POINT = 48;

// Medidas compartidas por el eje fijo y la gráfica con scroll. Tienen que ser
// idénticas para que las líneas de referencia queden a la misma altura.
const CHART_HEIGHT = 240;
const CHART_MARGIN_TOP = 22;
const X_AXIS_HEIGHT = 30;
const Y_AXIS_WIDTH = 56;

const CHART_OPTIONS: { type: ChartType; label: string }[] = [
  { type: "line", label: "Línea" },
  { type: "bar", label: "Barras" },
  { type: "scatter", label: "Puntos" },
];

// Calcula un eje Y con números "redondos" (ej. 0, 10, 20, 30) y unas 4
// divisiones. Se calcula a mano, y no con el automático de Recharts, porque
// el eje fijo y la gráfica con scroll son dos gráficas distintas y deben
// coincidir exactamente.
function niceAxis(values: number[]) {
  const dataMin = Math.min(0, ...values);
  const dataMax = Math.max(0, ...values);
  const range = dataMax - dataMin || 1;
  const rough = range / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ??
    10 * magnitude;
  const lower = Math.floor(dataMin / step) * step;
  const upper = Math.ceil(dataMax / step) * step;
  const count = Math.round((upper - lower) / step);
  const ticks = Array.from({ length: count + 1 }, (_, i) =>
    Number((lower + i * step).toFixed(6)),
  );
  return { domain: [ticks[0], ticks[ticks.length - 1]] as [number, number], ticks };
}

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

  const points = data.map((point, index) => ({
    ...point,
    key: point.key ?? `${index}-${point.time}`,
  }));
  const byKey = new Map(points.map((point) => [point.key, point]));
  const axis = niceAxis(points.map((point) => point.value));

  // Un "tramo" empieza en la primera lectura de cada día. El separador y el
  // nombre del día se dibujan ahí; los tramos impares llevan fondo suave.
  const segments: { startKey: string; label: string }[] = [];
  points.forEach((point, index) => {
    if (point.day && (index === 0 || point.day !== points[index - 1].day)) {
      segments.push({ startKey: point.key, label: point.dayLabel ?? point.day });
    }
  });
  const lastKey = points.length > 0 ? points[points.length - 1].key : undefined;

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

      <div className="flex">
        {/* Eje Y fijo: no se mueve con el scroll de la gráfica. */}
        <div className="shrink-0 overflow-hidden" style={{ width: Y_AXIS_WIDTH }}>
          {/* Se dibuja 20 px más ancha que el contenedor: con un área de
              dibujo de 0 px Recharts no pinta las marcas. El sobrante se recorta. */}
          <ComposedChart
            data={points}
            width={Y_AXIS_WIDTH + 20}
            height={CHART_HEIGHT}
            margin={{ top: CHART_MARGIN_TOP, right: 0, left: 0, bottom: 0 }}
          >
            <YAxis
              stroke="#5B6663"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={Y_AXIS_WIDTH}
              domain={axis.domain}
              ticks={axis.ticks}
            />
            <XAxis dataKey="key" tick={false} axisLine={false} tickLine={false} height={X_AXIS_HEIGHT} />
            {/* Serie invisible: sin ninguna serie, Recharts no calcula la escala del eje. */}
            <Line
              dataKey="value"
              stroke="none"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
            />
          </ComposedChart>
        </div>

        <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
          <div style={{ minWidth: points.length * PX_PER_POINT }}>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <ComposedChart
                data={points}
                margin={{ top: CHART_MARGIN_TOP, right: 10, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="#D8D4C9" strokeDasharray="3 3" vertical={false} />
                {segments.map((segment, index) =>
                  index % 2 === 1 && lastKey ? (
                    <ReferenceArea
                      key={`area-${segment.startKey}`}
                      x1={segment.startKey}
                      x2={segments[index + 1]?.startKey ?? lastKey}
                      fill="#D8D4C9"
                      fillOpacity={0.3}
                      ifOverflow="visible"
                    />
                  ) : null,
                )}
                {segments.map((segment, index) => (
                  <ReferenceLine
                    key={`line-${segment.startKey}`}
                    x={segment.startKey}
                    stroke="#5B6663"
                    strokeDasharray="4 3"
                    strokeOpacity={index === 0 ? 0 : 0.6}
                    ifOverflow="visible"
                    label={(props: { viewBox?: { x?: number; y?: number } }) => (
                      <text
                        x={(props.viewBox?.x ?? 0) + 6}
                        y={(props.viewBox?.y ?? 0) - 6}
                        fontSize={11}
                        fontWeight={600}
                        fill="#12181B"
                      >
                        {segment.label}
                      </text>
                    )}
                  />
                ))}
                <XAxis
                  dataKey="key"
                  tickFormatter={(key: string) => byKey.get(key)?.time ?? ""}
                  stroke="#5B6663"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  height={X_AXIS_HEIGHT}
                />
                {/* Oculto: solo fija la misma escala que el eje fijo de la izquierda. */}
                <YAxis hide domain={axis.domain} ticks={axis.ticks} />
                <Tooltip
                  // La gráfica de puntos registra también el eje X como fila del
                  // tooltip (aquí sería el id de la lectura); solo dejamos el valor.
                  content={(props) => (
                    <DefaultTooltipContent
                      {...props}
                      payload={props.payload?.filter((item) => item.dataKey === "value")}
                    />
                  )}
                  contentStyle={{
                    backgroundColor: "#F7F6F2",
                    border: "1px solid #D8D4C9",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#12181B" }}
                  labelFormatter={(key) => {
                    const point = byKey.get(String(key));
                    return point?.full ?? point?.time ?? String(key);
                  }}
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
    </div>
  );
}
