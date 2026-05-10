"use client";
import type { Skill, Domain } from "@prisma/client";

interface SkillWithDomain extends Skill {
  domain: Domain;
}

interface SkillSelectorProps {
  skills: SkillWithDomain[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function SkillSelector({ skills, selectedId, onSelect }: SkillSelectorProps) {
  const grouped: Record<string, SkillWithDomain[]> = {};
  for (const skill of skills) {
    const domain = skill.domain.name;
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(skill);
  }

  return (
    <div className="border-b border-gray-800 px-6 py-3">
      <select
        className="bg-gray-900 border border-gray-700 text-gray-300 text-sm font-mono px-3 py-2 focus:outline-none focus:border-orange-500 min-w-[300px]"
        value={selectedId ?? ""}
        onChange={(e) => { if (e.target.value) onSelect(e.target.value); }}
      >
        <option value="">— Select a skill —</option>
        {Object.entries(grouped).map(([domain, domainSkills]) => (
          <optgroup key={domain} label={domain}>
            {domainSkills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
