import Link from "next/link";
import { prisma } from "@sellly/database";
import { Badge, buttonVariants, EmptyState, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireStore } from "@/lib/session";

export default async function DiscountsPage({ params }: { params: { store: string } }) {
  const { store } = await requireStore(params.store);
  const discounts = await prisma.discount.findMany({
    where: { storeId: store.id },
    include: { codes: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-primary">Discounts</h1>
          <p className="text-body text-muted">Create promo codes to boost sales.</p>
        </div>
        <Link href={`/${store.slug}/discounts/new`} className={buttonVariants({})}>
          Create discount
        </Link>
      </div>

      {discounts.length === 0 ? (
        <EmptyState
          title="No discounts yet"
          description="Create your first promo code to run a sale or reward repeat customers."
          action={
            <Link href={`/${store.slug}/discounts/new`} className={buttonVariants({})}>
              Create discount
            </Link>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Code</Th>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Value</Th>
              <Th>Used</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <tbody>
            {discounts.map((d) => (
              <Tr key={d.id}>
                <Td className="font-mono">{d.codes[0]?.code}</Td>
                <Td>{d.title}</Td>
                <Td>{d.type.replace("_", " ")}</Td>
                <Td>{d.type === "PERCENTAGE" ? `${d.value}%` : `₹${d.value}`}</Td>
                <Td>
                  {d.usageCount}
                  {d.usageLimit ? ` / ${d.usageLimit}` : ""}
                </Td>
                <Td>
                  <Badge variant={d.isActive ? "success" : "default"}>{d.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
