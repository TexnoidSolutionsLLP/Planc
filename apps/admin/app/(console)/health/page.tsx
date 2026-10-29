import { prisma } from "@sellly/database";
import { checkStorageBucket } from "@sellly/storage";
import { Badge, Card, CardDescription, CardHeader, CardTitle } from "@sellly/ui";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

type Check = { name: string; status: "ok" | "warn" | "fail" | "unknown"; detail: string };

const BADGE = { ok: "success", warn: "warning", fail: "error", unknown: "default" } as const;
const LABEL = { ok: "Working", warn: "Attention", fail: "Down", unknown: "Not verified" } as const;

async function timed<T>(fn: () => Promise<T>) {
  const start = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - start };
}

async function databaseCheck(): Promise<Check> {
  try {
    const { ms } = await timed(() => prisma.$queryRaw`SELECT 1`);
    const [{ count }] = await prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`;
    return { name: "Database (PostgreSQL)", status: "ok", detail: `Responded in ${ms} ms · ${count} migrations applied` };
  } catch {
    return { name: "Database (PostgreSQL)", status: "fail", detail: "Query failed" };
  }
}

async function supabaseAuthCheck(): Promise<Check> {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { name: "Supabase Auth", status: "fail", detail: "SUPABASE_URL / SUPABASE_ANON_KEY not set" };
  try {
    const { value: res, ms } = await timed(() => fetch(`${url}/auth/v1/health`, { headers: { apikey: key }, cache: "no-store", signal: AbortSignal.timeout(4000) }));
    return res.ok
      ? { name: "Supabase Auth", status: "ok", detail: `Healthy, responded in ${ms} ms` }
      : { name: "Supabase Auth", status: "fail", detail: `Health endpoint returned ${res.status}` };
  } catch {
    return { name: "Supabase Auth", status: "fail", detail: "Not reachable" };
  }
}

async function storageCheck(): Promise<Check> {
  const result = await checkStorageBucket();
  return { name: "File storage (Supabase Storage)", status: result.ok ? "ok" : "fail", detail: result.detail };
}

async function deliveryCheck(channel: "email" | "whatsapp", name: string, envKeys: string[]): Promise<Check> {
  const since = new Date(Date.now() - 24 * 3600_000);
  const rows = await prisma.notification.groupBy({ by: ["status"], where: { channel, createdAt: { gt: since } }, _count: true });
  const count = (s: string) => rows.find((r) => r.status === s)?._count ?? 0;
  const sent = count("SENT");
  const failed = count("FAILED");
  const pending = count("PENDING");
  const configured = envKeys.every((k) => process.env[k]);
  const activity = `Last 24 h: ${sent} sent, ${failed} failed, ${pending} pending`;
  if (sent + failed + pending === 0) {
    return { name, status: "unknown", detail: `${activity}. ${configured ? "Keys set in this deployment" : "Keys not set in this deployment"} — no recent sends to judge by.` };
  }
  const status = failed === 0 ? "ok" : failed > sent ? "fail" : "warn";
  return { name, status, detail: activity };
}

async function paymentsCheck(): Promise<Check> {
  const since = new Date(Date.now() - 24 * 3600_000);
  const [rows, connected] = await Promise.all([
    prisma.payment.groupBy({ by: ["status"], where: { method: { not: "COD" }, createdAt: { gt: since } }, _count: true }),
    prisma.paymentConnection.count({ where: { isActive: true } }),
  ]);
  const count = (s: string) => rows.find((r) => r.status === s)?._count ?? 0;
  const paid = count("PAID");
  const failed = count("FAILED");
  const detail = `${connected} store(s) with online payments connected · last 24 h: ${paid} paid, ${failed} failed, ${count("PENDING")} pending`;
  if (paid + failed === 0) return { name: "Online payments (Razorpay)", status: "unknown", detail };
  return { name: "Online payments (Razorpay)", status: failed === 0 ? "ok" : failed > paid ? "fail" : "warn", detail };
}

function configCheck(name: string, keys: string[], note?: string): Check {
  const missing = keys.filter((k) => !process.env[k]);
  return missing.length
    ? { name, status: "warn", detail: `Not set in this deployment: ${missing.join(", ")}${note ? `. ${note}` : ""}` }
    : { name, status: "unknown", detail: `Set in this deployment — not tested${note ? `. ${note}` : ""}` };
}

export default async function HealthPage() {
  await requireAdmin();
  const live = await Promise.all([
    databaseCheck(),
    supabaseAuthCheck(),
    storageCheck(),
    paymentsCheck(),
    deliveryCheck("email", "Email delivery (Resend)", ["RESEND_API_KEY"]),
    deliveryCheck("whatsapp", "WhatsApp messages (Meta Cloud API)", ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]),
  ]);
  const config = [
    configCheck("Storefront link", ["STOREFRONT_URL"], "Used for store links on this page"),
    configCheck("Rate limiting", [], "In-memory per server instance — limits aren't shared across Vercel instances"),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-title text-primary">System health</h1>
        <p className="text-body text-muted">
          Live checks against shared services, plus recent delivery results from the database. Nothing here is estimated: where there&apos;s no
          recent activity to judge by, it says so.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
          <CardDescription>Checked now, on page load.</CardDescription>
        </CardHeader>
        <CheckList checks={live} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This deployment&apos;s settings</CardTitle>
          <CardDescription>
            The merchant app and storefront are separate Vercel projects with their own settings, so check those projects too.
          </CardDescription>
        </CardHeader>
        <CheckList checks={config} />
      </Card>
    </div>
  );
}

function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="divide-y divide-border">
      {checks.map((c) => (
        <li key={c.name} className="flex flex-wrap items-start justify-between gap-2 py-3">
          <div>
            <p className="text-small font-medium text-primary">{c.name}</p>
            <p className="text-caption text-muted">{c.detail}</p>
          </div>
          <Badge variant={BADGE[c.status]}>{LABEL[c.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
