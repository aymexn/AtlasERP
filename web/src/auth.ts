import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

/**
 * Fetch all active permissions for a user as compact strings.
 * Returns ["clients:client:read", "sales:order:create", ...]
 * Mirrors what the NestJS backend embeds in atlas_token.
 */
async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    return [
      ...new Set(
        userRoles.flatMap((ur) =>
          ur.role.permissions.map(
            (rp) =>
              `${rp.permission.module}:${rp.permission.resource}:${rp.permission.action}`
          )
        )
      ),
    ];
  } catch {
    return [];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash || user.status !== "ACTIVE")
          return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          companyRole: null,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      console.log("[AUTH TRACE] redirect callback:", { url, baseUrl });
      // Absolute lockdown rule to break post-auth recursive redirect traps
      if (url.includes('/login') || url === baseUrl || url.endsWith('/fr')) {
        const dest = `${baseUrl}/fr/dashboard`;
        console.log("[AUTH TRACE] redirect override:", dest);
        return dest;
      }
      const dest = url.startsWith(baseUrl) ? url : `${baseUrl}/fr/dashboard`;
      console.log("[AUTH TRACE] redirect final:", dest);
      return dest;
    },
    async jwt({ token, user }) {
      console.log("[AUTH TRACE] jwt callback input:", { token, user });
      if (user) {
        token.id = user.id;
        token.companyId = (user as any).companyId;
        token.role = (user as any).role;
        token.companyRole = (user as any).companyRole;
        // Embed permissions on first login — mirrors the atlas_token payload
        try {
          token.permissions = await getUserPermissions(user.id as string);
          console.log("[AUTH TRACE] jwt permissions fetched:", token.permissions);
        } catch (err) {
          console.error("[AUTH TRACE] jwt error fetching permissions:", err);
        }
      }
      console.log("[AUTH TRACE] jwt callback output:", token);
      return token;
    },
    async session({ session, token }) {
      console.log("[AUTH TRACE] session callback input:", { session, token });
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).companyId = token.companyId;
        (session.user as any).role = token.role;
        (session.user as any).companyRole = token.companyRole;
        (session.user as any).permissions = token.permissions; // forward to client session
      }
      console.log("[AUTH TRACE] session callback output:", session);
      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
