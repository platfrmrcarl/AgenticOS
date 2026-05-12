import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { SkillFrequency } from "@prisma/client";

interface DraftSkill {
  name: string;
  description: string;
  frequency: string;
  input?: string;
  output?: string;
  successCriteria?: string;
}

interface DraftDomain {
  name: string;
  successVision?: string;
  skills: DraftSkill[];
}

const ALLOWED_FREQ: SkillFrequency[] = ["ON_DEMAND", "LOCAL_ROUTINE", "CLOUD_ROUTINE"];

function normalizeFrequency(raw: string): SkillFrequency {
  const upper = raw?.toUpperCase().replace(/[\s-]/g, "_") as SkillFrequency;
  return ALLOWED_FREQ.includes(upper) ? upper : "ON_DEMAND";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  let payload: { domains?: DraftDomain[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const domains = payload.domains;
  if (!Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json({ error: "domains required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.skill.deleteMany({ where: { userId, enabled: false } });
    await tx.domain.deleteMany({
      where: { userId, skills: { none: {} } },
    });

    for (const [position, d] of domains.entries()) {
      const created = await tx.domain.create({
        data: {
          userId,
          name: d.name,
          successVision: d.successVision ?? null,
          position,
        },
      });
      for (const s of d.skills) {
        await tx.skill.create({
          data: {
            userId,
            domainId: created.id,
            name: s.name,
            description: s.description,
            frequency: normalizeFrequency(s.frequency),
            input: s.input || null,
            output: s.output || null,
            successCriteria: s.successCriteria || null,
            enabled: false,
          },
        });
      }
    }
  });

  return NextResponse.json({ ok: true });
}
