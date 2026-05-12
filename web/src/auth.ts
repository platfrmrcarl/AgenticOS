import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

const useSecureCookies = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  cookies: {
    sessionToken: { options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies } },
    callbackUrl: { options: { sameSite: "lax", path: "/", secure: useSecureCookies } },
    csrfToken: { options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies } },
    pkceCodeVerifier: { options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies } },
    state: { options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies } },
    nonce: { options: { httpOnly: true, sameSite: "lax", path: "/", secure: useSecureCookies } },
  },
  providers: [
    ...authConfig.providers,
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
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

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) return null;

        return user;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    ...authConfig.callbacks,
    authorized: () => true,
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
});
