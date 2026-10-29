import Link from "next/link";
import { ThemeToggle } from "@sellly/ui";
import { Activity, Building2, KeyRound, LogOut, Package, ScrollText, Store, TrendingUp } from "lucide-react";
import { prisma } from "@sellly/database";
import { requireAdmin } from "@/lib/require-admin";
import { signOutAction } from "@/lib/actions";

const NAV = [
  { href: "/", label: "Merchants", Icon: Building2 },
  { href: "/stores", label: "Stores", Icon: Store },
  { href: "/orders", label: "Orders", Icon: Package },
  { href: "/revenue", label: "Revenue", Icon: TrendingUp },
  { href: "/access", label: "My access", Icon: KeyRound },
  { href: "/audit", label: "Audit history", Icon: ScrollText },
  { href: "/health", label: "System health", Icon: Activity },
];

// Every console page is per-staff-member and permission-checked on each request.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireAdmin();
  const activeGrants = await prisma.accessRequest.count({
    where: { requestedById: staff.id, status: "APPROVED", expiresAt: { gt: new Date() } },
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="shrink-0 border-b border-border bg-surface p-3 md:flex md:w-60 md:flex-col md:border-b-0 md:border-r md:p-4">
        <div className="mb-3 flex items-center justify-between md:mb-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-brand text-[13px] font-bold text-white">S</span>
            <span className="text-[15px] font-semibold tracking-tight">Admin</span>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col" aria-label="Platform">
          {NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex h-10 items-center gap-2.5 whitespace-nowrap rounded px-3 text-[14px] font-medium text-muted transition-colors duration-150 hover:bg-secondary hover:text-primary md:h-9"
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {href === "/access" && activeGrants > 0 && (
                <span className="ml-auto rounded-full bg-success-soft px-1.5 text-caption text-success" aria-label={`${activeGrants} active`}>
                  {activeGrants}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 md:mt-auto">
          <span className="truncate text-caption text-muted" title={staff.email}>
            {staff.email}
          </span>
          <form action={signOutAction}>
            <button type="submit" className="flex h-8 items-center gap-1.5 rounded px-2 text-caption text-muted hover:bg-secondary hover:text-primary">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
