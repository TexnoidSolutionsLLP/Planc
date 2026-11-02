"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, MoreVertical, Search } from "lucide-react";
import { Card, cn } from "@sellly/ui";
import type { Channel } from "../_lib/sample-data";
import { ChannelIcon } from "./channel-icon";
import { Delta } from "./delta";

type Row = {
  id: string;
  name: string;
  views: number;
  orders: number;
  revenue: number;
  conversion: number;
  change: number;
  stock: number;
  source: Channel;
};

const SORTS = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
  { key: "conversion", label: "Conversion" },
  { key: "change", label: "Growth" },
] as const;

const SOURCE_LABEL: Record<Channel, string> = { instagram: "Instagram", whatsapp: "WhatsApp", direct: "Direct link" };
const money = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function ProductPerformanceTable({ rows, storeSlug }: { rows: Row[]; storeSlug: string }) {
  const [query, setQuery] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const sort = SORTS[sortIndex];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(q)).sort((a, b) => b[sort.key] - a[sort.key]);
  }, [rows, query, sort.key]);

  return (
    <Card className="p-0 sm:p-0">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-primary">Product performance</h2>
          <p className="text-small text-muted">Ranked by {sort.label.toLowerCase()} this period</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="h-8 w-44 rounded border border-border bg-surface pl-8 pr-3 text-[13px] text-primary placeholder:text-subtle focus:border-brand focus:outline-none sm:w-56"
            />
          </label>
          <button
            type="button"
            onClick={() => setSortIndex((i) => (i + 1) % SORTS.length)}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-border bg-surface px-3 text-[13px] font-medium text-primary transition-colors hover:bg-secondary"
          >
            <ArrowDownUp className="h-3.5 w-3.5 text-muted" />
            Sort: {sort.label}
          </button>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-small">
          <thead>
            <tr className="border-b border-border text-caption uppercase tracking-wide text-subtle">
              <th className="px-5 py-2.5 font-medium sm:px-6">Rank</th>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="px-3 py-2.5 text-right font-medium">Views</th>
              <th className="px-3 py-2.5 text-right font-medium">Orders</th>
              <th className="px-3 py-2.5 text-right font-medium">Revenue</th>
              <th className="px-3 py-2.5 text-right font-medium">Conversion</th>
              <th className="px-3 py-2.5 font-medium">Growth</th>
              <th className="px-3 py-2.5 font-medium">Top source</th>
              <th className="px-5 py-2.5 sm:px-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((r, i) => (
              <tr key={r.id} className="transition-colors hover:bg-background">
                <td className="tabular px-5 py-3 font-medium text-muted sm:px-6">#{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-secondary text-caption font-semibold text-muted">
                      {r.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-primary">{r.name}</p>
                      <p className={cn("text-caption", r.stock < 10 ? "text-warning" : "text-subtle")}>
                        {r.stock < 10 ? `Low stock · ${r.stock} left` : `${r.stock} in stock`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="tabular px-3 py-3 text-right text-muted">{r.views.toLocaleString("en-IN")}</td>
                <td className="tabular px-3 py-3 text-right text-primary">{r.orders.toLocaleString("en-IN")}</td>
                <td className="tabular px-3 py-3 text-right font-medium text-primary">{money(r.revenue)}</td>
                <td className="tabular px-3 py-3 text-right text-muted">{r.conversion.toFixed(1)}%</td>
                <td className="px-3 py-3">
                  <Delta value={r.change} />
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-2 text-muted">
                    <ChannelIcon channel={r.source} className="h-5 w-5" />
                    {SOURCE_LABEL[r.source]}
                  </span>
                </td>
                <td className="px-5 py-3 text-right sm:px-6">
                  <Link
                    href={`/${storeSlug}/products`}
                    aria-label={`Manage ${r.name}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-subtle transition-colors hover:bg-secondary hover:text-primary"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-10 text-center text-muted">
                  No products match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
