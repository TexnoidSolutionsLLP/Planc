"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Channel } from "../_lib/sample-data";

const MUTED = "rgb(var(--color-text-muted))";
const SERIES: { key: Channel; label: string; color: string }[] = [
  { key: "instagram", label: "Instagram", color: "rgb(var(--color-primary))" },
  { key: "whatsapp", label: "WhatsApp", color: "rgb(var(--color-success))" },
  { key: "direct", label: "Direct link", color: "rgb(var(--color-warning))" },
];

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function SalesTrendChart({
  data,
  height = 220,
}: {
  data: { date: string; instagram: number; whatsapp: number; direct: number }[];
  height?: number;
}) {
  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="rgb(var(--color-border))" vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={8} minTickGap={28} />
            <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={48} />
            <Tooltip
              cursor={{ stroke: "rgb(var(--color-border-strong))" }}
              contentStyle={{
                background: "rgb(var(--color-surface))",
                border: "1px solid rgb(var(--color-border))",
                borderRadius: 10,
                fontSize: 12,
                boxShadow: "var(--shadow-md)",
                color: "rgb(var(--color-text))",
              }}
              labelFormatter={(l) => formatDay(String(l))}
              formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, SERIES.find((s) => s.key === name)?.label ?? name]}
            />
            {SERIES.map((s) => (
              <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} animationDuration={600} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-muted">
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
