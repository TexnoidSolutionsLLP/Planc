import { Check } from "lucide-react";
import { prisma } from "@sellly/database";
import { Badge, Card, CardDescription, CardHeader, CardTitle, cn } from "@sellly/ui";
import { requireStore } from "@/lib/session";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "₹0",
    blurb: "Everything you need to start selling.",
    features: ["Unlimited products", "Basic storefront", "Basic order management", "Sellly branding on storefront"],
  },
  {
    key: "PRO",
    name: "Pro",
    price: "₹999",
    blurb: "For sellers ready to look and run like a brand.",
    features: ["Custom domain", "Advanced analytics", "Remove Sellly branding", "Discount codes", "WhatsApp notifications", "Advanced themes"],
  },
  {
    key: "BUSINESS",
    name: "Business",
    price: "₹2,499",
    blurb: "For teams fulfilling orders every day.",
    features: ["Everything in Pro", "Staff accounts", "Automation", "Abandoned cart recovery", "Advanced shipping", "Priority support"],
  },
];

export default async function BillingPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const [subscription, productCount, orderCount] = await Promise.all([
    prisma.subscription.findUnique({ where: { storeId: store.id } }),
    prisma.product.count({ where: { storeId: store.id } }),
    prisma.order.count({ where: { storeId: store.id } }),
  ]);
  const current = subscription?.plan ?? "FREE";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-title text-primary">Billing</h1>
        <p className="mt-1 text-body text-muted">Your plan and usage for {store.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Current plan</CardTitle>
            <CardDescription className="mt-0.5">You&apos;re on the {PLANS.find((p) => p.key === current)?.name} plan.</CardDescription>
          </div>
          <Badge variant="accent">{PLANS.find((p) => p.key === current)?.name}</Badge>
        </CardHeader>
        <dl className="grid grid-cols-2 gap-6 border-t border-border pt-5 text-small sm:grid-cols-3">
          <div>
            <dt className="text-muted">Products</dt>
            <dd className="tabular mt-1 text-[20px] font-semibold text-primary">{productCount}</dd>
          </div>
          <div>
            <dt className="text-muted">Orders (all time)</dt>
            <dd className="tabular mt-1 text-[20px] font-semibold text-primary">{orderCount}</dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1 text-[20px] font-semibold text-primary">{subscription?.status === "ACTIVE" || !subscription ? "Active" : "Attention needed"}</dd>
          </div>
        </dl>
      </Card>

      <div>
        <h2 className="mb-4 text-[15px] font-semibold tracking-tight text-primary">Plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === current;
            return (
              <Card key={plan.key} className={cn("flex flex-col", isCurrent && "border-brand ring-1 ring-brand/20")}>
                <div className="flex items-center justify-between">
                  <p className="text-[15px] font-semibold text-primary">{plan.name}</p>
                  {isCurrent && <Badge variant="accent">Current</Badge>}
                </div>
                <p className="mt-3 text-primary">
                  <span className="tabular text-[30px] font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-small text-muted"> / month</span>
                </p>
                <p className="mt-1 text-small text-muted">{plan.blurb}</p>
                <ul className="mt-5 space-y-2.5 text-small">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-primary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.25} />
                      {f}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-small text-muted">
          Paid plans aren&apos;t self-serve yet. To move to Pro or Business, email{" "}
          <a className="font-medium text-brand hover:text-brand-hover" href="mailto:hello@sellly.app?subject=Plan%20upgrade">
            hello@sellly.app
          </a>{" "}
          and we&apos;ll switch your store over.
        </p>
      </div>
    </div>
  );
}
