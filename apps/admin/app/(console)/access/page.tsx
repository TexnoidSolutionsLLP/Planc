import Link from "next/link";
import { ACCESS_SCOPES, displayStatus, prisma, type DisplayStatus } from "@sellly/database";
import { Badge, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";
import { cancelRequestAction, relinquishAccessAction } from "@/lib/actions";
import { Notice } from "../_components/notice";

const VARIANT: Record<DisplayStatus, "default" | "success" | "warning" | "error"> = {
  PENDING: "warning",
  ACTIVE: "success",
  EXPIRED: "default",
  REJECTED: "error",
  REVOKED: "error",
  CANCELLED: "default",
};

/** The signed-in staff member's own requests and grants. Staff can withdraw or end them, never approve them. */
export default async function MyAccessPage({ searchParams }: { searchParams: { error?: string; done?: string } }) {
  const staff = await requireAdmin();
  const requests = await prisma.accessRequest.findMany({
    where: { requestedById: staff.id },
    include: { store: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">My access</h1>
        <p className="text-body text-muted">Your requests to store owners. Only an owner can approve; approvals end automatically.</p>
      </div>
      <Notice error={searchParams.error} done={searchParams.done} messages={{ cancelled: "Request withdrawn.", relinquished: "Access ended." }} />
      {requests.length === 0 ? (
        <p className="text-small text-muted">You haven&apos;t requested access to any store. Open a store to request it.</p>
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Store</Th>
              <Th>Area</Th>
              <Th>Asked / granted</Th>
              <Th>Status</Th>
              <Th>Ends</Th>
              <Th>Owner&apos;s note</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </Thead>
          <tbody>
            {requests.map((r) => {
              const status = displayStatus(r, now);
              const asked = [r.requestedView && "view", r.requestedModify && "change"].filter(Boolean).join(" + ");
              const granted = [r.grantedView && "view", r.grantedModify && "change"].filter(Boolean).join(" + ");
              return (
                <Tr key={r.id}>
                  <Td>
                    <Link href={`/stores/${r.store.id}`} className="hover:underline">
                      {r.store.name}
                    </Link>
                  </Td>
                  <Td>{ACCESS_SCOPES[r.scope].label}</Td>
                  <Td className="text-small">
                    {asked}
                    {r.status === "APPROVED" && <span className="block text-caption text-muted">granted: {granted}</span>}
                  </Td>
                  <Td>
                    <Badge variant={VARIANT[status]}>{status.toLowerCase()}</Badge>
                  </Td>
                  <Td className="text-caption text-muted">{r.expiresAt ? r.expiresAt.toLocaleString("en-IN") : "—"}</Td>
                  <Td className="text-caption text-muted">{r.decisionNote ?? "—"}</Td>
                  <Td>
                    {status === "PENDING" && (
                      <form action={cancelRequestAction.bind(null, r.id, "/access")}>
                        <button type="submit" className="text-caption text-muted underline hover:text-primary">
                          Withdraw
                        </button>
                      </form>
                    )}
                    {status === "ACTIVE" && (
                      <form action={relinquishAccessAction.bind(null, r.id, "/access")}>
                        <button type="submit" className="text-caption text-muted underline hover:text-primary">
                          End now
                        </button>
                      </form>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
