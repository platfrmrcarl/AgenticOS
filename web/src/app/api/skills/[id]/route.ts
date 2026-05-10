import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const owned = await prisma.skill.findFirst({ where: { id, userId: session.user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const skill = await prisma.skill.update({ where: { id }, data: body });
  return NextResponse.json(skill);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await prisma.skill.findFirst({ where: { id, userId: session.user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.skill.delete({ where: { id } });
  return NextResponse.json({ deleted: id });
}
