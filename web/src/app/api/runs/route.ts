import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const runs = await prisma.skillRun.findMany({
    where: { userId: session.user.id, startedAt: { gte: thirtyDaysAgo } },
    include: { skill: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(runs);
}
