import { getStoreOverview, getRevenueByDay, getTopProducts, getConversionFunnel } from "@sellly/analytics";
import { Card, CardHeader, CardTitle } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { RevenueChart } from "./_components/revenue-chart";
import { StatCard } from "../_components/stat-card";

export default async function AnalyticsPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [overview, revenueByDay, topProducts, funnel] = await Promise.all([
    getStoreOverview(store.id, since),
    getRevenueByDay(store.id, since),
    getTopProducts(store.id, since, 8),
    getConversionFunnel(store.id, since),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Analytics</h1>
        <p className="text-body text-muted">Last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue" value={`₹${overview.revenue.toLocaleString("en-IN")}`} />
        <StatCard label="Orders" value={overview.orders.toString()} />
        <StatCard label="Avg. order value" value={`₹${overview.averageOrderValue.toFixed(0)}`} />
        <StatCard label="Conversion rate" value={`${funnel.conversionRate.toFixed(1)}%`} hint={`${funnel.pageViews} store visits`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
        </CardHeader>
        <ul className="space-y-2 text-small">
          <li className="flex justify-between"><span>Store visits</span><span className="text-muted">{funnel.pageViews}</span></li>
          <li className="flex justify-between"><span>Added to cart</span><span className="text-muted">{funnel.addToCart}</span></li>
          <li className="flex justify-between"><span>Started checkout</span><span className="text-muted">{funnel.checkoutStarted}</span></li>
          <li className="flex justify-between"><span>Orders placed</span><span className="text-muted">{funnel.ordersPlaced}</span></li>
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <RevenueChart data={revenueByDay} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
        </CardHeader>
        {topProducts.length === 0 ? (
          <p className="text-small text-muted">No sales yet in this period.</p>
        ) : (
          <ul className="space-y-2">
            {topProducts.map((p) => (
              <li key={p.productId} className="flex justify-between text-small">
                <span className="text-primary">{p.title}</span>
                <span className="text-muted">{p.unitsSold} sold</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
