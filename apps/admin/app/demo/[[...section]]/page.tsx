import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { DemoConsole } from "../demo-console";
import { STORES } from "../sample-data";

export const dynamic = "force-dynamic";

export default function AdminDemoPage({
  params,
}: {
  params: { section?: string[] };
}) {
  // This is an isolated fixture viewer, never an authentication bypass.
  if (process.env.NODE_ENV !== "development") notFound();
  const path = params.section ?? [];
  const section = path[0] ?? "overview";
  const isStoreDetail =
    section === "stores" &&
    path.length === 2 &&
    STORES.some((store) => store.id === path[1]);
  if (
    !isStoreDetail &&
    (path.length > 1 ||
      ![
        "overview",
        "merchants",
        "stores",
        "orders",
        "revenue",
        "access",
        "audit",
        "health",
      ].includes(section))
  )
    notFound();
  return (
    <AdminShell
      demo
      selectedPath={section === "overview" ? "/" : `/${path.join("/")}`}
      email="demo@example.test"
      activeGrants={2}
      footerAction={
        <Link
          href="/login"
          className="shrink-0 rounded px-2 py-1 text-caption text-muted hover:bg-secondary hover:text-primary"
        >
          Exit demo
        </Link>
      }
    >
      <DemoConsole
        key={path.join("/")}
        section={section}
        storeId={isStoreDetail ? path[1] : undefined}
      />
    </AdminShell>
  );
}
