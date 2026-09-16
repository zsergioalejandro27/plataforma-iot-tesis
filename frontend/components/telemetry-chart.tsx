"use client";

import {
  Line,
  LineChart,
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

export function TelemetryChart({
  data,
  unit,
}: {
  data: TelemetryPoint[];
  unit: string | null;
}) {
  return (
    <div className="border-b border-line p-5">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="#2B6E63"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
