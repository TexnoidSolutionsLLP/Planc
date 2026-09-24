import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@sellly/database";
import { verifyPassword } from "./password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user?.passwordHash) return null;

        const valid = verifyPassword(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId as string;
      }
      return session;
    },
  },
});

export { hashPassword, verifyPassword } from "./password";

/**
 * Resolves the store a request is acting on and asserts the signed-in user
 * is a member of it. Every dashboard route MUST call this before touching
 * store-scoped data — it is the single tenant-isolation checkpoint.
 */
export async function requireStoreAccess(userId: string, storeSlug: string) {
  const store = await prisma.store.findUnique({ where: { slug: storeSlug } });
  if (!store) return null;

  const membership = await prisma.storeMember.findUnique({
    where: { storeId_userId: { storeId: store.id, userId } },
  });
  if (!membership) return null;

  return { store, membership };
}
