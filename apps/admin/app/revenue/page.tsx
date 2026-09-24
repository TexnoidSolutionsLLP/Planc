import { prisma } from "@sellly/database";
import { Card } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

const PLAN_PRICE: Record<string, number> = { FREE: 0, PRO: 999, BUSINESS: 2499 };

export default async function RevenuePage() {
  await requireAdmin();

  const subscriptions = await prisma.subscription.findMany({ where: { status: "ACTIVE" } });
  const mrr = subscriptions.reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);

  const gmvAgg = await prisma.order.aggregate({
    where: { status: { notIn: ["CANCELLED", "FAILED"] } },
    _sum: { total: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-title text-primary">Platform revenue</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-small text-muted">Monthly recurring revenue</p>
          <p className="mt-2 text-h2 text-primary">₹{mrr.toLocaleString("en-IN")}</p>
        </Card>
        <Card>
          <p className="text-small text-muted">Gross merchandise value (all time)</p>
          <p className="mt-2 text-h2 text-primary">₹{Number(gmvAgg._sum.total ?? 0).toLocaleString("en-IN")}</p>
        </Card>
      </div>
    </div>
  );
}
