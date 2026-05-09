import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { input } = await req.json();

  const run = await prisma.skillRun.create({
    data: {
      userId: session.user.id,
      skillId: id,
      input,
      status: "RUNNING",
    },
  });

  const agentsUrl = process.env.AGENTS_SERVICE_URL ?? "http://localhost:8000";
  const sessionResp = await fetch(`${agentsUrl}/sessions`, { method: "POST" });
  const { session_id } = await sessionResp.json() as { session_id: string };

  const upstream = await fetch(`${agentsUrl}/run/agentic-os-guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, message: input }),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      if (!upstream.body) { controller.close(); return; }
      const reader = upstream.body.getReader();
      let output = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = new TextDecoder().decode(value);
        output += text;
        controller.enqueue(encoder.encode(text));
      }
      await prisma.skillRun.update({
        where: { id: run.id },
        data: { status: "COMPLETED", output, endedAt: new Date() },
      });
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { "Content-Type": "text/event-stream", "X-Run-ID": run.id },
  });
}
