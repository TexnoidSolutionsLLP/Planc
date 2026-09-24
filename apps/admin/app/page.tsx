import { prisma } from "@sellly/database";
import { Badge, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

export default async function MerchantsPage() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    include: { memberships: { include: { store: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-title text-primary">Merchants</h1>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Stores</Th>
            <Th>Joined</Th>
          </Tr>
        </Thead>
        <tbody>
          {users.map((u) => (
            <Tr key={u.id}>
              <Td>{u.name ?? "—"}</Td>
              <Td className="text-muted">{u.email}</Td>
              <Td>
                {u.memberships.map((m) => (
                  <Badge key={m.id} className="mr-1">
                    {m.store.name}
                  </Badge>
                ))}
              </Td>
              <Td className="text-muted">{u.createdAt.toLocaleDateString("en-IN")}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
