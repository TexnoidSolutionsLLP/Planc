import Image from "next/image";
import Link from "next/link";
import type { ProductStatus } from "@sellly/database";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@sellly/ui";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LOW_STOCK_THRESHOLD, stockState, unitEconomics } from "@/lib/product-metrics";

const STATUS_VARIANT = {
  DRAFT: "secondary",
  ACTIVE: "success",
  ARCHIVED: "outline",
} as const;

export type ProductRow = {
  id: string;
  name: string;
  status: ProductStatus;
  price: number | string;
  cost: number | string | null;
  trackInventory: boolean;
  inventoryQty: number;
  images: { url: string }[];
};

/** The Products screen: shared by the real page and the /dev-preview page. */
export function ProductsView({
  store,
  products,
  unitsSold,
  lowStockCount,
  filter,
  q,
}: {
  store: { slug: string };
  products: ProductRow[];
  unitsSold: Map<string | null, number>;
  lowStockCount: number;
  filter?: string;
  q?: string;
}) {
  const filters = [
    { key: undefined, label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "low-stock", label: "Low stock" },
    { key: "out-of-stock", label: "Out of stock" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-primary">Products</h1>
          <p className="text-body text-muted">Manage what you sell.</p>
        </div>
        <Button asChild>
          <Link href={`/${store.slug}/products/new`}>Add product</Link>
        </Button>
      </div>

      {lowStockCount > 0 && filter !== "low-stock" && (
        <Alert className="border-warning/30 bg-warning-soft">
          <AlertTriangle className="h-4 w-4 !text-warning" />
          <AlertDescription>
            <Link href="?status=low-stock" className="text-primary">
              {lowStockCount} product{lowStockCount === 1 ? " is" : "s are"} running low (≤ {LOW_STOCK_THRESHOLD} left).{" "}
              <span className="font-medium underline">Review</span>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={filter ?? "all"} className="overflow-x-auto">
        <TabsList aria-label="Filter products">
          {filters.map((f) => (
            <TabsTrigger key={f.label} value={f.key ?? "all"} asChild>
              <Link href={f.key ? `?status=${f.key}` : "?"}>{f.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {products.length === 0 ? (
        <EmptyState
          title={q ? `No results for “${q}”` : "No products yet"}
          description={q ? "Try a different name, or clear the search." : "Add your first product to start building your store."}
          action={
            <Button asChild>
              <Link href={`/${store.slug}/products/new`}>Add product</Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
        <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">Est. margin</TooltipTrigger>
                  <TooltipContent>Per unit at list price, before discounts, shipping, payment fees and refunds</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>
                <Tooltip>
                  <TooltipTrigger className="cursor-help">Units sold</TooltipTrigger>
                  <TooltipContent>From confirmed, non-cancelled orders</TooltipContent>
                </Tooltip>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link href={`/${store.slug}/products/${p.id}`} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-secondary">
                      {p.images[0] && <Image src={p.images[0].url} alt="" width={40} height={40} className="h-full w-full object-cover" />}
                    </div>
                    <span className="font-medium text-primary hover:underline">{p.name}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                </TableCell>
                <TableCell>
                  {(() => {
                    const state = stockState(p);
                    if (state === "untracked") return <span className="text-muted">Not tracked</span>;
                    if (state === "out") return <span className="text-error">Out of stock</span>;
                    if (state === "low") return <span className="font-medium text-warning">{p.inventoryQty} · Low</span>;
                    return p.inventoryQty;
                  })()}
                </TableCell>
                <TableCell className="tabular">₹{Number(p.price).toLocaleString("en-IN")}</TableCell>
                <TableCell className="tabular text-muted">{p.cost != null ? `₹${Number(p.cost).toLocaleString("en-IN")}` : "—"}</TableCell>
                <TableCell className="tabular">
                  {(() => {
                    const { profit, margin } = unitEconomics(Number(p.price), p.cost != null ? Number(p.cost) : null);
                    if (profit == null || margin == null)
                      return (
                        <span className="text-muted" title="Add a cost to see margin">
                          —
                        </span>
                      );
                    return (
                      <span className={profit < 0 ? "text-error" : undefined}>
                        ₹
                        {profit.toLocaleString("en-IN", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-muted">({Math.round(margin * 100)}%)</span>
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="tabular">{unitsSold.get(p.id) ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
        </Card>
      )}
    </div>
  );
}
