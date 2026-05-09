def build_triage_prompt(skill_name: str) -> str:
    return (
        f"You are in Phase 4: Automation Triage for the skill \"{skill_name}\".\n\n"
        "Ask the user these three questions (one at a time):\n\n"
        "1. How often does this skill need to run? "
        "(on-demand / daily / weekly / monthly / event-triggered)\n"
        "2. Does this skill need to touch local files, the filesystem, or local CLIs? (yes/no)\n"
        "3. Does this skill need to keep running while your laptop is closed? (yes/no)\n\n"
        "Based on the answers, tag the skill with one of:\n"
        "- ON-DEMAND — triggered manually\n"
        "- LOCAL ROUTINE — runs on a local schedule (needs filesystem OR always on desktop)\n"
        "- CLOUD ROUTINE — runs remotely on a schedule (web/API only, must run while laptop closed)\n\n"
        "Be honest — if a skill does not yet need automation, leave it on-demand. "
        "Do not over-automate. Ask about frequency first."
    )
