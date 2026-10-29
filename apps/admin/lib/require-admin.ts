import { redirect } from "next/navigation";
import { getCurrentUser } from "@sellly/auth";

/**
 * Every admin page and server action starts here. Being staff only unlocks
 * platform-level pages; a store's protected data additionally needs an
 * owner-approved grant (see lib/staff-access.ts).
 */
export async function requireAdmin() {
  const user = await getCurrentUser("admin");
  if (!user) redirect("/login");
  if (user.platformRole !== "PLATFORM_ADMIN" || user.status !== "ACTIVE") redirect("/login?error=denied");
  return user;
}
