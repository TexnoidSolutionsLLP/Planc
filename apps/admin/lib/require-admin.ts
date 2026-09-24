import { redirect } from "next/navigation";
import { auth } from "@sellly/auth";
import { prisma } from "@sellly/database";

export async function requireAdmin() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.platformRole !== "PLATFORM_ADMIN") redirect("/login");

  return user;
}
