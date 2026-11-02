"use client";

import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@sellly/ui";

const GREEN = "rgb(var(--color-primary))";
const MUTED = "rgb(var(--color-text-muted))";

const tooltipStyle = {
  background: "rgb(var(--color-surface))",
  border: "1px solid rgb(var(--color-border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "var(--shadow-md)",
  color: "rgb(var(--color-text))",
};

const inrK = (v: number) => (v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L` : `₹${Math.round(v / 1000)}k`);

type BarPoint = { label: string; value: number };

/** Hatched bars with the peak bar filled solid and labelled — the card's focal point. */
export function SalesBars({ weekly, monthly }: { weekly: BarPoint[]; monthly: BarPoint[] }) {
  const [mode, setMode] = useState<"weekly" | "monthly">("monthly");
  const data = mode === "weekly" ? weekly : monthly;
  const peak = data.reduce((m, d, i) => (d.value > data[m].value ? i : m), 0);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <div role="group" aria-label="Granularity" className="inline-flex rounded-full bg-secondary p-1">
          {(["weekly", "monthly"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "rounded-full px-3.5 py-1 text-[12px] font-semibold capitalize transition-colors duration-150",
                mode === m ? "bg-brand text-white shadow-sm" : "text-muted hover:text-primary"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 28, right: 0, left: -18, bottom: 0 }} barCategoryGap="22%">
            <defs>
              <pattern id="demo3Hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="rgb(var(--color-primary) / 0.28)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--color-primary) / 0.45)" strokeWidth="2" />
              </pattern>
            </defs>
            <CartesianGrid stroke="rgb(var(--color-border))" vertical={false} strokeDasharray="3 4" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={8} />
            <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickFormatter={inrK} width={52} />
            <Tooltip cursor={{ fill: "rgb(var(--color-primary) / 0.06)" }} contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Sales"]} />
            <Bar dataKey="value" radius={[999, 999, 999, 999]} animationDuration={600}>
              {data.map((d, i) => (
                <Cell key={d.label} fill={i === peak ? GREEN : "url(#demo3Hatch)"} />
              ))}
              <LabelList
                dataKey="value"
                content={(props) => {
                  const { x, y, width, index, value } = props as { x: number; y: number; width: number; index: number; value: number };
                  if (index !== peak) return null;
                  const label = inrK(value);
                  const w = label.length * 7 + 16;
                  return (
                    <g>
                      <rect x={x + width / 2 - w / 2} y={y - 26} width={w} height={20} rx={10} fill={GREEN} />
                      <text x={x + width / 2} y={y - 12} textAnchor="middle" fontSize={11} fontWeight={600} fill="#fff">
                        {label}
                      </text>
                    </g>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Edge-to-edge balance wave for the payout card. */
export function BalanceWave({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="h-[120px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="demo3Wave" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.35} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[(min: number) => min * 0.7, "auto"]} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Balance"]} labelFormatter={(l) => String(l)} />
          <XAxis dataKey="label" hide />
          <Area type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2} fill="url(#demo3Wave)" dot={false} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
