"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check } from "lucide-react";
import { cn } from "@sellly/ui";

const MUTED = "rgb(var(--color-text-muted))";

/** Today vs yesterday hourly sales — two smooth lines like the reference. */
export function TrendsChart({ data }: { data: { hour: string; today: number; yesterday: number }[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="demo5Line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--color-border))" vertical={false} />
          <XAxis dataKey="hour" tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} tickMargin={8} interval={2} />
          <YAxis tick={{ fontSize: 11, fill: MUTED }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: "#6366f1", strokeDasharray: "4 4" }}
            contentStyle={{
              background: "rgb(var(--color-surface))",
              border: "1px solid rgb(var(--color-border))",
              borderRadius: 10,
              fontSize: 12,
              boxShadow: "var(--shadow-md)",
              color: "rgb(var(--color-text))",
            }}
            formatter={(v: number, n: string) => [`${v} orders`, n === "today" ? "Today" : "Yesterday"]}
          />
          <Line type="natural" dataKey="yesterday" stroke="rgb(var(--color-border-strong))" strokeWidth={2} dot={false} />
          <Line
            type="natural"
            dataKey="today"
            stroke="url(#demo5Line)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: "#6366f1", stroke: "rgb(var(--color-surface))", strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type Task = { id: number; label: string; tag: "Urgent" | "New" | "Default"; done: boolean };

const TAG = {
  Urgent: "bg-amber-400 text-amber-950",
  New: "bg-emerald-500 text-white",
  Default: "bg-secondary text-muted",
};

/** Checkable to-do list; ticking an item moves it to done. */
export function ActivityList({ initial }: { initial: Task[] }) {
  const [tasks, setTasks] = useState(initial);
  const left = tasks.filter((t) => !t.done).length;

  return (
    <div>
      <p className="mb-3 text-caption font-normal text-subtle">{left === 0 ? "All caught up 🎉" : `${left} of ${tasks.length} still to do`}</p>
      <ul className="space-y-1">
        {tasks.map((t) => (
          <li key={t.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors hover:bg-secondary">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={t.done}
                onChange={() => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              />
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400",
                  t.done ? "border-indigo-500 bg-indigo-500 text-white" : "border-border-strong text-transparent"
                )}
                aria-hidden="true"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <span className={cn("flex-1 text-small", t.done ? "text-subtle line-through" : "font-medium text-primary")}>{t.label}</span>
              <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", TAG[t.tag])}>{t.tag}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
