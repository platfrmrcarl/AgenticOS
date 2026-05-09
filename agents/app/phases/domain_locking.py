def build_domain_locking_prompt(brain_dump: list[str]) -> str:
    items = "\n".join(f"- {item}" for item in brain_dump)
    return (
        "You are in Phase 2: Domain Locking of the Agentic OS setup.\n\n"
        "The user has completed their brain dump. Here is what they listed:\n\n"
        f"{items}\n\n"
        "Now ask them: 'Looking at everything you just listed, what are the 3-5 core business domains "
        "that bundle all this work together?'\n\n"
        "A domain is a thematic area of work — not a tool, not a task, but a cluster of related outputs. "
        "Examples: 'client delivery,' 'hiring,' 'investor relations,' 'content creation,' 'internal ops.'\n\n"
        "For each domain they name, ask one follow-up: "
        "'What would success look like in [domain] if it ran on autopilot?'\n\n"
        "Lock in 3-5 domains. Ask ONE question at a time."
    )
