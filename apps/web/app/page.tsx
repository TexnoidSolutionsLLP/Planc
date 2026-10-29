import { redirect } from "next/navigation";
import { getCurrentUser, isSupabaseAuthConfigured } from "@sellly/auth";
import { prisma } from "@sellly/database";
import { Landing } from "@/components/marketing/landing";

// Per-visitor: signed-in merchants are sent to their dashboard, everyone else sees the landing page.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  // The marketing page still renders before Supabase is configured.
  const user = isSupabaseAuthConfigured() ? await getCurrentUser("web") : null;
  if (!user) return <Landing />;
  if (user.status !== "ACTIVE") redirect("/login?error=suspended");
  if (user.platformRole !== "MERCHANT") redirect("/login?error=staff");
  const userId = user.id;

  const membership = await prisma.storeMember.findFirst({
    where: { userId },
    include: { store: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/onboarding");
  redirect(`/${membership.store.slug}/overview`);
}
