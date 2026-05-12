import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const host = (req.headers.get("host") ?? req.nextUrl.host).toLowerCase();
  if (host === "agenticoperations.net") {
    const url = req.nextUrl.clone();
    url.host = "www.agenticoperations.net";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
