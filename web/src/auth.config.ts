import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/setup") ||
        nextUrl.pathname.startsWith("/skills");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
  },
};
