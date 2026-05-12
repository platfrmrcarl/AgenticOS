import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAgentsAuthHeader } from "@/lib/agents-auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let role: string;
  let vision: string;
  try {
    ({ role, vision } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!role?.trim() || !vision?.trim()) {
    return NextResponse.json({ error: "role and vision are required" }, { status: 400 });
  }

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  let upstream: Response;
  try {
    const authHeader = await getAgentsAuthHeader();
    upstream = await fetch(`${agentsUrl}/run/auto-configure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.user.id,
        ...authHeader,
      },
      body: JSON.stringify({ user_id: session.user.id, role, vision }),
    });
  } catch (err) {
    console.error("agents fetch failed:", err);
    return NextResponse.json({ error: "Agents service unavailable" }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = upstream.body ? await upstream.text().catch(() => "") : "";
    console.error("agents upstream error:", upstream.status, detail.slice(0, 500));
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
