import { prisma } from "@sellly/database";
import { Badge, Card, CardHeader, CardTitle } from "@sellly/ui";
import { requireStore } from "@/lib/session";
import { AddDomainForm } from "./_components/add-domain-form";
import { DomainRow } from "./_components/domain-row";

export default async function DomainPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const domains = await prisma.domain.findMany({ where: { storeId: store.id }, orderBy: { createdAt: "asc" } });

  const subdomain = domains.find((d) => d.isSubdomain);
  const customDomains = domains.filter((d) => !d.isSubdomain);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-primary">Domain</h1>
        <p className="text-body text-muted">Your storefront's web address.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sellly subdomain</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-between">
          <p className="text-body text-primary">{subdomain?.hostname ?? store.slug}.sellly.app</p>
          <Badge variant="success">Always active</Badge>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom domain</CardTitle>
        </CardHeader>
        <p className="mb-4 text-small text-muted">
          Connect your own domain (Pro plan). Point it at Sellly with a CNAME record, then verify ownership with a
          TXT record.
        </p>

        {customDomains.length > 0 && (
          <ul className="mb-4 space-y-3">
            {customDomains.map((d) => (
              <DomainRow key={d.id} storeSlug={store.slug} domain={d} />
            ))}
          </ul>
        )}

        <AddDomainForm storeSlug={store.slug} />
      </Card>
    </div>
  );
}
