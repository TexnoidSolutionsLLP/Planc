import { redirect } from "next/navigation";
import { auth } from "@sellly/auth";
import { prisma } from "@sellly/database";
import { Landing } from "@/components/marketing/landing";

export default async function RootPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) return <Landing />;

  const membership = await prisma.storeMember.findFirst({
    where: { userId },
    include: { store: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/onboarding");
  redirect(`/${membership.store.slug}/overview`);
}
