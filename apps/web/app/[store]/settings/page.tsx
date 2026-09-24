import { prisma } from "@sellly/database";
import { Badge, Button, Card, CardHeader, CardTitle, Input, Label, Textarea } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { togglePublishAction, toggleCodAction, toggleWhatsappAction } from "@/lib/actions/settings";
import { SettingsForm } from "./_components/settings-form";
import { RazorpayForm } from "./_components/razorpay-form";

export default async function SettingsPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const [settings, paymentConnection, subscription] = await Promise.all([
    prisma.storeSettings.findUnique({ where: { storeId: store.id } }),
    prisma.paymentConnection.findUnique({ where: { storeId_provider: { storeId: store.id, provider: "razorpay" } } }),
    prisma.subscription.findUnique({ where: { storeId: store.id } }),
  ]);

  const publishAction = togglePublishAction.bind(null, store.slug);
  const codAction = toggleCodAction.bind(null, store.slug);
  const whatsappAction = toggleWhatsappAction.bind(null, store.slug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-primary">Settings</h1>
        <p className="text-body text-muted">Store details, payments and plan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store status</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <Badge variant={store.status === "PUBLISHED" ? "success" : "warning"}>{store.status}</Badge>
            <p className="mt-2 text-small text-muted">
              {store.status === "PUBLISHED" ? "Your store is live and visible to customers." : "Your store is hidden from customers."}
            </p>
          </div>
          <form action={publishAction}>
            <Button type="submit" variant={store.status === "PUBLISHED" ? "secondary" : "primary"}>
              {store.status === "PUBLISHED" ? "Unpublish" : "Publish store"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
        </CardHeader>
        <SettingsForm storeSlug={store.slug} name={store.name} description={store.description ?? ""} supportEmail={settings?.supportEmail ?? ""} supportPhone={settings?.supportPhone ?? ""} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="text-body font-medium text-primary">Cash on Delivery</p>
            <p className="text-small text-muted">Accept orders that customers pay for at delivery.</p>
          </div>
          <form action={codAction}>
            <Button type="submit" variant="secondary" size="sm">
              {settings?.codEnabled ? "Disable" : "Enable"}
            </Button>
          </form>
        </div>
        <div className="pt-4">
          <p className="mb-2 text-body font-medium text-primary">
            Razorpay {paymentConnection?.isActive && <Badge variant="success">Connected</Badge>}
          </p>
          <p className="mb-3 text-small text-muted">Accept UPI, cards, net banking and wallets.</p>
          <RazorpayForm storeSlug={store.slug} connected={!!paymentConnection?.isActive} />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body font-medium text-primary">
              WhatsApp {settings?.whatsappEnabled && <Badge variant="success">Enabled</Badge>}
            </p>
            <p className="text-small text-muted">
              Send order confirmations and shipping updates over WhatsApp in addition to email. Requires a Meta
              Business account (WHATSAPP_ACCESS_TOKEN) — see docs/product/15-notifications.md.
            </p>
          </div>
          <form action={whatsappAction}>
            <Button type="submit" variant="secondary" size="sm">
              {settings?.whatsappEnabled ? "Disable" : "Enable"}
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan</CardTitle>
        </CardHeader>
        <p className="text-body text-primary">{subscription?.plan ?? "FREE"} plan</p>
        <p className="text-small text-muted">Upgrade to Pro for a custom domain, advanced analytics and WhatsApp notifications.</p>
      </Card>
    </div>
  );
}
