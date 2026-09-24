"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BRAND = "rgb(var(--color-primary))";
const MUTED = "rgb(var(--color-text-muted))";

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RevenueChart({ data, height = 260 }: { data: { date: string; revenue: number }[]; height?: number }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed border-border text-small text-muted" style={{ height }}>
        Revenue will appear here once you receive orders.
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND} stopOpacity={0.16} />
              <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-border))" strokeDasharray="0" vertical={false} />
          <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 12, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={10} minTickGap={24} />
          <YAxis tick={{ fontSize: 12, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)} width={56} />
          <Tooltip
            cursor={{ stroke: "rgb(var(--color-border-strong))" }}
            contentStyle={{
              background: "rgb(var(--color-surface))",
              border: "1px solid rgb(var(--color-border))",
              borderRadius: 10,
              fontSize: 13,
              boxShadow: "var(--shadow-md)",
              color: "rgb(var(--color-text))",
            }}
            labelFormatter={(l) => formatDay(String(l))}
            formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
          />
          <Area type="monotone" dataKey="revenue" stroke={BRAND} strokeWidth={2} fill="url(#revenueFill)" animationDuration={600} activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
