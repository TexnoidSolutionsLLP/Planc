/**
 * One-time move of existing accounts from the old Auth.js login to Supabase Auth.
 *
 *   pnpm --filter @sellly/auth users:migrate --dry-run
 *   pnpm --filter @sellly/auth users:migrate [--send-reset https://app.example.com/auth/callback?next=/reset-password]
 *
 * Old password hashes (scrypt) can't be imported into Supabase, so each
 * merchant gets a Supabase account with no password and must set one through
 * "Forgot password" (or the reset email this script sends with --send-reset).
 * Linking every row now also closes the window where someone could register
 * an unclaimed email first. Staff accounts are skipped: set them up with staff:create.
 */
import { prisma } from "@sellly/database";
import { adminClient, arg, findAuthUserByEmail, flag } from "./lib";

async function main() {
  const dryRun = flag("dry-run");
  const resetRedirect = arg("send-reset");
  const supabase = adminClient();

  const users = await prisma.user.findMany({ where: { authId: null }, orderBy: { createdAt: "asc" } });
  console.log(`${users.length} account(s) without a Supabase login${dryRun ? " (dry run)" : ""}.`);

  for (const user of users) {
    if (user.platformRole !== "MERCHANT") {
      console.log(`  skip  ${user.email} (staff — use staff:create)`);
      continue;
    }
    if (dryRun) {
      console.log(`  would link  ${user.email}`);
      continue;
    }
    let authUser = await findAuthUserByEmail(supabase, user.email);
    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({ email: user.email, email_confirm: true, user_metadata: { name: user.name } });
      if (error || !data.user) {
        console.error(`  FAIL  ${user.email}: ${error?.message}`);
        continue;
      }
      authUser = data.user;
    }
    await prisma.user.update({ where: { id: user.id }, data: { authId: authUser.id } });
    if (resetRedirect) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: resetRedirect });
      console.log(`  linked ${user.email}${error ? ` (reset email failed: ${error.message})` : " — reset email sent"}`);
    } else {
      console.log(`  linked ${user.email}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
