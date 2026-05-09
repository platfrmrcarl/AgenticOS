import os
import json
from pathlib import Path
from anthropic import AsyncAnthropic

client = AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
DESIGN_MD_PATH = Path(__file__).parent.parent.parent / "design.md"


def _load_system_prompt() -> str:
    if DESIGN_MD_PATH.exists():
        design_content = DESIGN_MD_PATH.read_text()
    else:
        design_content = "Guide the user through building their Agentic OS in 5 phases."
    return (
        "You are the AgenticOS guide agent. Your job is to walk the user through "
        "building their personal Agentic OS in 5 phases.\n\n"
        "PROTOCOL:\n"
        f"{design_content}\n\n"
        "CRITICAL RULES:\n"
        "- Ask ONE question at a time. Never ask multiple questions in one message.\n"
        "- After each phase is fully complete, emit exactly: __PHASE_COMPLETE__{phase_number}\n"
        "- After the marker, emit a JSON object on the same line with the phase data.\n"
        "- Phase 1 data: {\"items\": [list of brain dump items]}\n"
        "- Phase 2 data: {\"domains\": [{\"name\": str, \"successVision\": str}]}\n"
        "- Phase 3 data: {\"skills\": [{\"domainName\": str, \"skills\": [{\"name\": str, \"description\": str}]}]}\n"
        "- Phase 4 data: {\"triage\": [{\"skillName\": str, \"frequency\": str, \"needsFilesystem\": bool, \"needsRemote\": bool, \"tag\": str}]}\n"
        "- Phase 5 data: {\"deliverables\": {\"claudeMd\": str, \"folderStructure\": str, \"skillSpecs\": [], \"sevenDayPlan\": str}}\n"
        "- Be a thought partner. Push back on vague answers.\n"
        "- Use plain language.\n"
    )


SYSTEM_PROMPT = _load_system_prompt()


async def stream_agent_response(messages: list[dict]):
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        full_text = ""
        async for text in stream.text_stream:
            full_text += text
            yield f'data: {json.dumps({"type": "text", "content": text})}\n\n'

        for phase in range(1, 6):
            marker = f"__PHASE_COMPLETE__{phase}"
            if marker in full_text:
                idx = full_text.index(marker) + len(marker)
                rest = full_text[idx:].strip()
                try:
                    phase_data = json.loads(rest.split("\n")[0]) if rest else {}
                except json.JSONDecodeError:
                    phase_data = {}
                yield f'data: {json.dumps({"type": "phase_complete", "phase": phase, "data": phase_data})}\n\n'
                break

    yield "data: [DONE]\n\n"
