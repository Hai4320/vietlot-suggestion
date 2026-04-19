"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { DigitFrequency } from "@/lib/types";

interface DigitPositionChartProps {
  data: DigitFrequency[];
  title: string;
  color?: string;
}

export function DigitPositionChart({ data, title, color = "hsl(271, 91%, 65%)" }: DigitPositionChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis dataKey="digit" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value, _name, props) => {
                const payload = (props as unknown as { payload: DigitFrequency }).payload;
                return [`${value} lần (${payload.percentage.toFixed(1)}%)`, `Chữ số ${payload.digit}`];
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => {
                const ratio = entry.count / max;
                const opacity = 0.4 + ratio * 0.6;
                return <Cell key={index} fill={color} fillOpacity={opacity} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
