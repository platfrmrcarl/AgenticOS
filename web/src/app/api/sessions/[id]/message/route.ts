import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAgentsAuthHeader } from "@/lib/agents-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let message: string;
  try {
    ({ message } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const chatSession = await prisma.chatSession.findFirst({ where: { id, userId: session.user.id } });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = chatSession.messages as Array<{ role: string; content: string }>;
  messages.push({ role: "user", content: message });
  await prisma.chatSession.update({ where: { id }, data: { messages } });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  let upstream: Response;
  try {
    const authHeader = await getAgentsAuthHeader();
    upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-ID": session.user.id,
        ...authHeader,
      },
      body: JSON.stringify({ session_id: id, message }),
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
