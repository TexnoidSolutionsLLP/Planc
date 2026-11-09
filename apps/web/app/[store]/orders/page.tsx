import { prisma } from "@sellly/database";
import { requireStore } from "@/lib/session";
import { bulkUpdateOrderStatusAction } from "@/lib/actions/orders";
import { OrdersView } from "./orders-view";

function bulkNotice(raw?: string) {
  if (!raw) return null;
  if (raw === "invalid")
    return {
      tone: "text-error",
      text: "Select at least one order and a status.",
    };
  const [updated, skipped] = raw.split("-").map(Number);
  if (!Number.isFinite(updated)) return null;
  return {
    tone: "text-primary",
    text: `Updated ${updated} order${updated === 1 ? "" : "s"}.${skipped ? ` Skipped ${skipped} that were already past that status, cancelled, or not found.` : ""}`,
  };
}

export default async function OrdersPage({ params, searchParams }: { params: { store: string }; searchParams: { bulk?: string } }) {
  const { store } = await requireStore(params.store);
  const orders = await prisma.order.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true } },
      payment: { select: { method: true, status: true } },
      shipments: {
        select: { status: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  const notice = bulkNotice(searchParams.bulk);
  const bulkAction = bulkUpdateOrderStatusAction.bind(null, store.slug);

  return (
    <OrdersView
      store={{ slug: store.slug, name: store.name }}
      orders={orders.map((o) => ({ ...o, total: Number(o.total) }))}
      notice={notice}
      bulkAction={bulkAction}
    />
  );
}
