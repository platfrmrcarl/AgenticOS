"use client";
import { useState, useEffect, useCallback } from "react";
import { SkillSelector } from "@/components/skills/SkillSelector";
import { SkillRunner } from "@/components/skills/SkillRunner";
import { RunLog } from "@/components/skills/RunLog";
import type { Skill, Domain, SkillRun } from "@prisma/client";

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface RunWithSkill extends SkillRun {
  skill: Pick<Skill, "name"> | null;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillWithDomain[]>([]);
  const [runs, setRuns] = useState<RunWithSkill[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [skillsResp, runsResp] = await Promise.all([
      fetch("/api/skills"),
      fetch("/api/runs"),
    ]);
    setSkills(await skillsResp.json() as SkillWithDomain[]);
    setRuns(await runsResp.json() as RunWithSkill[]);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedSkill = skills.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      <SkillSelector skills={skills} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex flex-1 overflow-hidden">
        <SkillRunner skill={selectedSkill} onRunComplete={fetchData} />
        <RunLog runs={runs} />
      </div>
    </div>
  );
}
