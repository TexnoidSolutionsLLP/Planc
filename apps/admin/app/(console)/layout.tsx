import { LogOut } from "lucide-react";
import { prisma } from "@sellly/database";
import { requireAdmin } from "@/lib/require-admin";
import { signOutAction } from "@/lib/actions";
import { AdminShell } from "@/components/admin-shell";

// Every console page is per-staff-member and permission-checked on each request.
export const dynamic = "force-dynamic";

export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireAdmin();
  const activeGrants = await prisma.accessRequest.count({
    where: {
      requestedById: staff.id,
      status: "APPROVED",
      expiresAt: { gt: new Date() },
    },
  });

  return (
    <AdminShell
      email={staff.email}
      activeGrants={activeGrants}
      footerAction={
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex h-8 items-center gap-1.5 rounded px-2 text-caption text-muted hover:bg-secondary hover:text-primary"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      }
    >
      {children}
    </AdminShell>
  );
}
