"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { NumberFrequency } from "@/lib/types";

interface FrequencyBarChartProps {
  data: NumberFrequency[];
  color?: string;
}

function getBarColor(count: number, max: number, min: number): string {
  if (max === min) return "hsl(217, 91%, 60%)";
  const ratio = (count - min) / (max - min);
  // Blue (cold) → Red (hot)
  const hue = 217 - ratio * 217; // 217 (blue) → 0 (red)
  return `hsl(${hue}, 80%, 55%)`;
}

export function FrequencyBarChart({ data }: FrequencyBarChartProps) {
  const counts = data.map((d) => d.count);
  const max = Math.max(...counts, 1);
  const min = Math.min(...counts, 0);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <XAxis
            dataKey="number"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value, _name, props) => {
              const payload = (props as unknown as { payload: NumberFrequency }).payload;
              return [`${value} lần (${payload.percentage.toFixed(1)}%)`, `Số ${payload.number}`];
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getBarColor(entry.count, max, min)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
