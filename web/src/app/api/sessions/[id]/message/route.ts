import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { message } = await req.json();

  const chatSession = await prisma.chatSession.findUnique({ where: { id, userId: session.user.id } });
  if (!chatSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = chatSession.messages as Array<{ role: string; content: string }>;
  messages.push({ role: "user", content: message });
  await prisma.chatSession.update({ where: { id }, data: { messages } });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-ID": session.user.id },
    body: JSON.stringify({ session_id: id, message }),
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
