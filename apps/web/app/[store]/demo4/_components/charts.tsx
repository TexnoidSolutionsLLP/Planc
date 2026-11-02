"use client";

import { Area, AreaChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Colours come from the scoped .demo4-theme variables, so light/dark both work. */
const EMERALD = "var(--d4-primary)";
const GOLD = "var(--d4-gold)";
const MUTED = "var(--d4-muted)";

const tooltipStyle = {
  background: "var(--d4-surface)",
  border: "1px solid var(--d4-border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--d4-ink)",
  boxShadow: "0 8px 24px rgba(27, 42, 74, 0.10)",
};

const inrK = (v: number) =>
  v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L` : v >= 10_000 ? `₹${Math.round(v / 1000)}k` : v === 0 ? "₹0" : `₹${(v / 1000).toFixed(1)}k`;

export type TrendPoint = { label: string; current: number; previous: number };

/**
 * Hero chart: this period (emerald area) vs the previous period (dashed gold line).
 * One hero chart, one date range — the comparison gives every number context.
 */
export function RevenueTrend({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="demo4Area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EMERALD} stopOpacity={0.28} />
              <stop offset="100%" stopColor={EMERALD} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--d4-border)" vertical={false} strokeDasharray="3 4" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={8} minTickGap={16} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={inrK} width={54} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "var(--d4-border-strong)", strokeDasharray: "3 3" }}
            formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name === "current" ? "This period" : "Previous period"]}
          />
          <Line type="monotone" dataKey="previous" stroke={GOLD} strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={600} />
          <Area
            type="monotone"
            dataKey="current"
            stroke={EMERALD}
            strokeWidth={2.5}
            fill="url(#demo4Area)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--d4-surface)", fill: EMERALD }}
            animationDuration={700}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny trend line inside each KPI card. */
export function Sparkline({ values, tone = "primary" }: { values: number[]; tone?: "primary" | "gold" }) {
  const data = values.map((v, i) => ({ i, v }));
  const color = tone === "gold" ? GOLD : EMERALD;
  return (
    <div className="h-9 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={color} fillOpacity={0.08} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
