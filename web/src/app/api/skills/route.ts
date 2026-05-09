import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    include: { domain: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const skill = await prisma.skill.create({
    data: {
      userId: session.user.id,
      domainId: body.domainId,
      name: body.name,
      description: body.description,
      input: body.input,
      output: body.output,
      frequency: body.frequency ?? "ON_DEMAND",
      dependencies: body.dependencies,
      successCriteria: body.successCriteria,
    },
  });
  return NextResponse.json(skill);
}
