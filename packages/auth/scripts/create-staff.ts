/**
 * The only way to give someone Sellly staff (platform admin) access.
 *
 *   pnpm --filter @sellly/auth staff:create --email dev@yourcompany.com --name "Dev Name"
 *   pnpm --filter @sellly/auth staff:create --email dev@yourcompany.com --remove
 *
 * It needs DATABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which only the people
 * who run the infrastructure hold — there is deliberately no web page or API
 * for this. Staff accounts must be separate from merchant accounts: an
 * email that owns a store is refused, because an owner who is also staff
 * could otherwise end up on both sides of an access request.
 */
import { randomBytes } from "node:crypto";
import { userInfo } from "node:os";
import { prisma } from "@sellly/database";
import { adminClient, arg, findAuthUserByEmail, flag } from "./lib";

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim() || null;
  if (!email || !email.includes("@")) {
    console.error('Usage: staff:create --email person@company.com [--name "Full Name"] [--remove]');
    process.exit(1);
  }
  const operator = userInfo().username;

  if (flag("remove")) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.platformRole !== "PLATFORM_ADMIN") {
      console.log(`${email} is not staff — nothing to do.`);
      return;
    }
    await prisma.user.update({ where: { id: user.id }, data: { platformRole: "MERCHANT" } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "staff.removed", entity: "user", entityId: user.id, metadata: { operator } } });
    console.log(`Removed staff access from ${email}. Their existing access grants stop working immediately.`);
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email }, include: { memberships: true } });
  if (existing?.memberships.some((m) => m.role === "OWNER")) {
    console.error(`${email} owns a store. Use a separate email for the staff account.`);
    process.exit(1);
  }

  const supabase = adminClient();
  let authUser = await findAuthUserByEmail(supabase, email);
  let temporaryPassword: string | null = null;
  if (!authUser) {
    temporaryPassword = randomBytes(18).toString("base64url");
    const { data, error } = await supabase.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true });
    if (error || !data.user) throw error ?? new Error("Could not create the Supabase user");
    authUser = data.user;
  }

  if (existing?.authId && existing.authId !== authUser.id) {
    console.error(`${email} is linked to a different Supabase user. Fix the link manually before granting staff access.`);
    process.exit(1);
  }
  const owner = await prisma.user.findUnique({ where: { authId: authUser.id } });
  if (owner && owner.email !== email) {
    console.error(`That Supabase user is already linked to ${owner.email}.`);
    process.exit(1);
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { authId: authUser.id, platformRole: "PLATFORM_ADMIN", status: "ACTIVE", ...(name ? { name } : {}) },
    create: { email, name, authId: authUser.id, platformRole: "PLATFORM_ADMIN", emailVerified: new Date() },
  });
  await prisma.auditLog.create({ data: { userId: user.id, action: "staff.granted", entity: "user", entityId: user.id, metadata: { operator } } });

  console.log(`\n${email} now has Sellly staff access to the platform admin app.`);
  if (temporaryPassword) {
    console.log(`Temporary password (shown once — share it securely, then have them change it):\n  ${temporaryPassword}`);
  } else {
    console.log("They sign in with their existing Supabase password.");
  }
  console.log("Staff still need a store owner's approval before seeing or changing any store's protected data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
