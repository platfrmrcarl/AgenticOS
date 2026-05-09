def build_deliverable_prompt(domains: list[dict], skills: list[dict]) -> str:
    domain_list = "\n".join(
        f"- {d['name']}: {d.get('successVision', 'not specified')}" for d in domains
    )
    skill_lines = []
    for domain_entry in skills:
        domain_name = domain_entry["domainName"]
        for skill in domain_entry.get("skills", []):
            skill_lines.append(f"  - [{domain_name}] {skill['name']}: {skill['description']}")
    skill_list = "\n".join(skill_lines)
    return (
        "You are in Phase 5: Deliverable Output of the Agentic OS setup.\n\n"
        "The user has completed all previous phases. Here is a summary:\n\n"
        f"DOMAINS:\n{domain_list}\n\n"
        f"SKILLS:\n{skill_list}\n\n"
        "Now produce the starter package. Output the following four artifacts in order, "
        "as code blocks the user can copy directly:\n\n"
        "### Artifact 1: CLAUDE.md\n"
        "A starter master prompt defining the OS persona, folder structure "
        "(raw/, wiki/, projects/, .claude/skills/, decisions/, references/), "
        "the locked domains, the identified skills organized by domain, "
        "and a note that the OS is a living document.\n\n"
        "### Artifact 2: Skill Folder Structure\n"
        "A directory tree showing exactly which folders to create under .claude/skills/.\n\n"
        "### Artifact 3: Prioritized First 3 Skills\n"
        "For the first three highest-impact skills, output a structured spec: "
        "Skill Name, Domain, Input, Output, Frequency, Dependencies, Success Criteria.\n\n"
        "### Artifact 4: 7-Day Implementation Plan\n"
        "Day-by-day: Day 1 set up folders/CLAUDE.md, Days 2-4 build Skills 1-3, "
        "Day 5 test end-to-end, Day 6 integrate into daily workflow, Day 7 reflect and plan next batch."
    )
