"use client";

import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DONUT_COLORS } from "./palette";

const RED = "rgb(var(--color-primary))";
const MUTED = "rgb(var(--color-text-muted))";

const tooltipStyle = {
  background: "rgb(var(--color-surface))",
  border: "1px solid rgb(var(--color-border))",
  borderRadius: 10,
  fontSize: 12,
  boxShadow: "var(--shadow-md)",
  color: "rgb(var(--color-text))",
};

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Large revenue area for the hero card. */
export function HeroRevenueChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="demo2Hero" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.22} />
              <stop offset="100%" stopColor={RED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={formatDay} tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={8} minTickGap={32} />
          <YAxis hide domain={[(min: number) => Math.floor(min * 0.85), "auto"]} />
          <Tooltip
            cursor={{ stroke: RED, strokeOpacity: 0.3 }}
            contentStyle={tooltipStyle}
            labelFormatter={(l) => formatDay(String(l))}
            formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]}
          />
          <Area type="monotone" dataKey="value" stroke={RED} strokeWidth={2.5} fill="url(#demo2Hero)" activeDot={{ r: 5, strokeWidth: 2, stroke: "rgb(var(--color-surface))" }} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tiny trend line for KPI cards. */
export function Sparkline({ values, id }: { values: number[]; id: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-24" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={RED} stopOpacity={0.18} />
              <stop offset="100%" stopColor={RED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={RED} strokeWidth={1.75} fill={`url(#spark-${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Channel share donut with the total in the middle. */
export function ChannelDonut({ data, centerLabel, centerValue }: { data: { label: string; share: number }[]; centerLabel: string; centerValue: string }) {
  return (
    <div className="relative mx-auto h-[168px] w-[168px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="share" nameKey="label" innerRadius={58} outerRadius={80} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270}>
            {data.map((d, i) => (
              <Cell key={d.label} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${v}%`, n]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular text-[22px] font-semibold leading-none tracking-tight text-primary">{centerValue}</span>
        <span className="mt-1 text-caption text-muted">{centerLabel}</span>
      </div>
    </div>
  );
}

