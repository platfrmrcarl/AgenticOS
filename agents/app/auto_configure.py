import asyncio
import json
import logging
from typing import AsyncIterator

from app.agent import client

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"


def _strip_json_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t[3:]
        if t.endswith("```"):
            t = t[: -3]
    return t.strip()


async def _infer_domains(role: str, vision: str) -> list[dict]:
    prompt = (
        f"Given this user:\n"
        f"ROLE / BUSINESS: {role}\n"
        f"AUTOPILOT VISION: {vision}\n\n"
        "Identify EXACTLY 3 core business domains for them. A domain is a thematic "
        "area of work that bundles many related outputs — not a tool, not a single "
        "task. Examples: \"client delivery\", \"internal ops\", \"growth\", "
        "\"investor relations\", \"content production\".\n\n"
        "Respond with ONLY valid JSON, no preamble, no markdown fences:\n"
        '{"domains": [{"name": "...", "success_vision": "..."}, ...]}\n\n'
        "Each success_vision is one sentence describing what success looks like in "
        "that domain if it ran on autopilot."
    )

    resp = await client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text
    parsed = json.loads(_strip_json_fence(raw))
    return parsed["domains"][:3]


async def _infer_skills(
    role: str, vision: str, domain_name: str, domain_vision: str
) -> list[dict]:
    prompt = (
        f"USER ROLE / BUSINESS: {role}\n"
        f"USER AUTOPILOT VISION: {vision}\n"
        f"DOMAIN: {domain_name}\n"
        f"DOMAIN SUCCESS VISION: {domain_vision}\n\n"
        "List 4–7 specific, repeatable skills (tasks) that an AI agent could handle "
        "for this user in this domain. Each skill must be:\n"
        "- A specific, repeatable task with clear input and output\n"
        "- Named as a short verb phrase, e.g. \"draft weekly client status\", "
        "\"categorize raw transactions\", \"send invoice follow-up\"\n\n"
        "Respond with ONLY valid JSON, no preamble, no markdown fences:\n"
        '{"skills": [\n'
        '  {\n'
        '    "name": "verb phrase",\n'
        '    "description": "one short sentence",\n'
        '    "frequency": "ON_DEMAND" | "LOCAL_ROUTINE" | "CLOUD_ROUTINE",\n'
        '    "input": "what feeds it",\n'
        '    "output": "what it produces",\n'
        '    "success_criteria": "how the user knows it worked"\n'
        '  }\n'
        ']}\n\n'
        "Frequency rules:\n"
        "- ON_DEMAND: triggered manually by the user (default when unsure)\n"
        "- LOCAL_ROUTINE: needs filesystem access or the user's machine to be on\n"
        "- CLOUD_ROUTINE: runs autonomously in the cloud on a schedule"
    )

    resp = await client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text
    parsed = json.loads(_strip_json_fence(raw))
    return parsed["skills"][:7]


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


async def stream_auto_configure(role: str, vision: str) -> AsyncIterator[str]:
    queue: asyncio.Queue = asyncio.Queue()
    SENTINEL = object()

    async def run() -> None:
        try:
            await queue.put({"type": "status", "message": "Reading your vision..."})
            await queue.put({"type": "status", "message": "Identifying business domains..."})

            domains = await _infer_domains(role, vision)
            for d in domains:
                await queue.put(
                    {
                        "type": "domain_drafted",
                        "name": d["name"],
                        "success_vision": d.get("success_vision", ""),
                    }
                )

            async def stage_2(domain: dict) -> list[dict]:
                await queue.put(
                    {
                        "type": "status",
                        "message": f"Drafting skills for {domain['name']}...",
                    }
                )
                skills = await _infer_skills(
                    role, vision, domain["name"], domain.get("success_vision", "")
                )
                for s in skills:
                    await queue.put(
                        {
                            "type": "skill_drafted",
                            "domain_name": domain["name"],
                            "name": s.get("name", ""),
                            "description": s.get("description", ""),
                            "frequency": s.get("frequency", "ON_DEMAND"),
                            "input": s.get("input", ""),
                            "output": s.get("output", ""),
                            "success_criteria": s.get("success_criteria", ""),
                        }
                    )
                return skills

            results = await asyncio.gather(*(stage_2(d) for d in domains))

            await queue.put(
                {
                    "type": "complete",
                    "domains_count": len(domains),
                    "skills_count": sum(len(r) for r in results),
                }
            )
        except Exception as exc:
            logger.exception("auto-configure failed")
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await queue.put(SENTINEL)

    task = asyncio.create_task(run())
    try:
        while True:
            event = await queue.get()
            if event is SENTINEL:
                break
            yield _sse(event)
        yield "data: [DONE]\n\n"
    finally:
        if not task.done():
            task.cancel()
