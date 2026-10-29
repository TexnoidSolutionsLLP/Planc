import Link from "next/link";
import { prisma, storesWithActiveGrant, type Prisma } from "@sellly/database";
import { Button, Input, Select, Table, Thead, Th, Tr, Td } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

const PAGE_SIZE = 100;
const PLATFORM_PREFIXES = ["access.", "support.", "staff."];
const CATEGORIES = [
  { key: "access", label: "Access requests & decisions", prefixes: ["access."] },
  { key: "support", label: "Staff actions on stores", prefixes: ["support."] },
  { key: "staff", label: "Staff accounts", prefixes: ["staff."] },
  {
    key: "store",
    label: "Merchant activity",
    prefixes: ["order.", "orders.", "product.", "domain.", "settings.", "theme.", "store.", "collection.", "discount."],
  },
];

/**
 * Platform-level history (access requests, staff actions, staff accounts) is
 * visible to all staff. A store's own activity is visible only with that
 * owner's "Store details" view approval — the same rule as everywhere else.
 */
export default async function AuditPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; store?: string; from?: string; to?: string; page?: string };
}) {
  const staff = await requireAdmin();
  const viewable = await storesWithActiveGrant(staff.id, "STORE", "view");

  const visibility: Prisma.AuditLogWhereInput = {
    OR: [
      { storeId: null },
      ...PLATFORM_PREFIXES.map((p) => ({ action: { startsWith: p } })),
      ...(viewable.length ? [{ storeId: { in: viewable } }] : []),
    ],
  };

  const q = searchParams.q?.trim();
  const category = CATEGORIES.find((c) => c.key === searchParams.category);
  const from = searchParams.from ? new Date(`${searchParams.from}T00:00:00Z`) : null;
  const to = searchParams.to ? new Date(`${searchParams.to}T23:59:59Z`) : null;
  const page = Math.max(1, Number(searchParams.page) || 1);
  const insensitive = "insensitive" as const;

  const where: Prisma.AuditLogWhereInput = {
    AND: [
      visibility,
      ...(category ? [{ OR: category.prefixes.map((p) => ({ action: { startsWith: p } })) }] : []),
      ...(searchParams.store ? [{ storeId: searchParams.store }] : []),
      ...(from && !isNaN(from.getTime()) ? [{ createdAt: { gte: from } }] : []),
      ...(to && !isNaN(to.getTime()) ? [{ createdAt: { lte: to } }] : []),
      ...(q
        ? [
            {
              OR: [
                { action: { contains: q, mode: insensitive } },
                { entity: { contains: q, mode: insensitive } },
                { entityId: { contains: q } },
                { user: { email: { contains: q, mode: insensitive } } },
                { store: { name: { contains: q, mode: insensitive } } },
              ],
            },
          ]
        : []),
    ],
  };

  const [entries, total, stores] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, platformRole: true } }, store: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
    prisma.store.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);

  const pageHref = (p: number) => {
    const params = new URLSearchParams(Object.entries(searchParams).filter(([k, v]) => v && k !== "page") as [string, string][]);
    params.set("page", String(p));
    return `?${params}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">Audit history</h1>
        <p className="text-body text-muted">
          Who did what, and when. A store&apos;s own activity appears once its owner approves &ldquo;Store details&rdquo; view access.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-2">
        <Input name="q" defaultValue={q} placeholder="Search action, email, store, id" className="h-9 w-64" aria-label="Search" />
        <Select name="category" defaultValue={category?.key ?? ""} className="h-9 w-auto" aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select name="store" defaultValue={searchParams.store ?? ""} className="h-9 w-auto" aria-label="Store">
          <option value="">All stores</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Input type="date" name="from" defaultValue={searchParams.from} className="h-9 w-auto" aria-label="From date" />
        <Input type="date" name="to" defaultValue={searchParams.to} className="h-9 w-auto" aria-label="To date" />
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
      </form>

      <Table>
        <Thead>
          <Tr>
            <Th>When</Th>
            <Th>Action</Th>
            <Th>By</Th>
            <Th>Store</Th>
            <Th>Details</Th>
          </Tr>
        </Thead>
        <tbody>
          {entries.map((e) => (
            <Tr key={e.id}>
              <Td className="whitespace-nowrap text-caption text-muted">{e.createdAt.toLocaleString("en-IN")}</Td>
              <Td className="font-medium">{e.action}</Td>
              <Td className="text-small">
                {e.user?.email ?? "system"}
                {e.user?.platformRole === "PLATFORM_ADMIN" && <span className="block text-caption text-muted">staff</span>}
              </Td>
              <Td className="text-small">
                {e.store ? (
                  <Link href={`/stores/${e.store.id}`} className="hover:underline">
                    {e.store.name}
                  </Link>
                ) : (
                  "—"
                )}
              </Td>
              <Td className="max-w-[28rem] text-caption text-muted">
                {e.entity && `${e.entity}${e.entityId ? ` ${e.entityId}` : ""}`}
                {e.metadata != null && <code className="mt-0.5 block break-all">{JSON.stringify(e.metadata)}</code>}
              </Td>
            </Tr>
          ))}
          {entries.length === 0 && (
            <Tr>
              <Td colSpan={5} className="text-muted">
                No matching entries.
              </Td>
            </Tr>
          )}
        </tbody>
      </Table>

      <div className="flex items-center justify-between text-small text-muted">
        <span>
          {total.toLocaleString("en-IN")} {total === 1 ? "entry" : "entries"}
        </span>
        <span className="flex gap-3">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="hover:text-primary">
              ← Newer
            </Link>
          )}
          {page * PAGE_SIZE < total && (
            <Link href={pageHref(page + 1)} className="hover:text-primary">
              Older →
            </Link>
          )}
        </span>
      </div>
    </div>
  );
}
