import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let input: string;
  try {
    ({ input } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const run = await prisma.skillRun.create({
    data: {
      userId: session.user.id,
      skillId: id,
      input,
      status: "RUNNING",
    },
  });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  let upstream: Response;
  try {
    const sessionResp = await fetch(`${agentsUrl}/sessions`, { method: "POST" });
    if (!sessionResp.ok) throw new Error("Failed to create agent session");
    const { session_id } = await sessionResp.json() as { session_id: string };
    upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, message: input }),
    });
    if (!upstream.ok || !upstream.body) throw new Error("Upstream error");
  } catch {
    await prisma.skillRun.update({ where: { id: run.id }, data: { status: "FAILED", endedAt: new Date() } });
    return NextResponse.json({ error: "Agents service unavailable" }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let output = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        output += text;
        controller.enqueue(encoder.encode(text));
      }
      try {
        await prisma.skillRun.update({
          where: { id: run.id },
          data: { status: "COMPLETED", output, endedAt: new Date() },
        });
      } catch {
        await prisma.skillRun.update({ where: { id: run.id }, data: { status: "FAILED", endedAt: new Date() } });
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "X-Run-ID": run.id },
  });
}
