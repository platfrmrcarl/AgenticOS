import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { getAgentsAuthHeader } from "@/lib/agents-auth";

const AGENTS_URL = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";

async function proxy(
  req: NextRequest,
  params: { path: string[] }
): Promise<NextResponse> {
  const session = await auth();
  const path = "/" + params.path.join("/");
  const url = `${AGENTS_URL}${path}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("authorization");
  headers.delete("cookie");
  if (session?.user?.id) headers.set("X-User-ID", session.user.id);
  for (const [k, v] of Object.entries(await getAgentsAuthHeader())) {
    headers.set(k, v);
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxy(req, await params);
}
