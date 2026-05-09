def build_brain_dump_prompt() -> str:
    return (
        "You are beginning Phase 1: Brain Dump of the Agentic OS setup. "
        "Ask the user to brain dump everything they do in a typical week. "
        "Tell them to be messy — no structure, no categorization, no filtering. "
        "Just a stream of every recurring task, project, communication channel, tool, deliverable, "
        "and ritual that fills their time. They should aim for 20-50 items minimum.\n\n"
        "If they get stuck, prompt them with examples:\n"
        "- What do you do every Monday morning?\n"
        "- What's the first thing you check when you sit down?\n"
        "- What do you wish you didn't have to do?\n"
        "- What do you keep meaning to do but never get to?\n\n"
        "Wait until they say they are done dumping. Do NOT proceed to Phase 2 until they confirm they are done."
    )
