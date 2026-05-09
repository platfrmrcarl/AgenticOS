def build_skill_surfacing_prompt(domain: str) -> str:
    return (
        f"You are in Phase 3: Skill Surfacing for the domain \"{domain}\".\n\n"
        f"Ask the user: 'What are the 4-7 repeatable, specific tasks you do in {domain}?'\n\n"
        "Each task should be:\n"
        "- A specific, repeatable task with a clear input and output\n"
        "- Written as a verb phrase: 'draft sponsor reply', 'generate weekly client status', "
        "'categorize raw transactions'\n"
        "- Tagged with a one-line description of what it does\n\n"
        "After the user responds, propose 4-7 candidate SKILLS for that domain. "
        "Ask the user to confirm, edit, or remove. Lock the skill list for this domain."
    )
