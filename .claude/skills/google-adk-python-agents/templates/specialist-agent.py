# templates/specialist-agent.py
# Template for a single specialist agent in a multi-agent pipeline
# Pattern: focused prompt + Pydantic schema + retry-once-on-validation-fail

from __future__ import annotations
import json
import logging
from typing import TypeVar
from pydantic import BaseModel, ValidationError
from google.generativeai import GenerativeModel

from .prompts import WRITER_SYSTEM_PROMPT  # Prompts live in prompts.py, NOT inline
from .schemas import DraftOutput, ResearchOutput

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


async def write_draft(
    topic: str,
    research: ResearchOutput,
    voice: str,
    additional_constraints: list[str] | None = None,
) -> DraftOutput:
    """Specialist: produces a draft post given research + voice + constraints."""

    user_prompt = _render_user_prompt(topic, research, voice, additional_constraints)

    model = GenerativeModel(
        "gemini-2.5-flash",  # Flash for drafting; Pro reserved for quality-critical
        system_instruction=WRITER_SYSTEM_PROMPT,
    )

    return await _generate_with_validation(
        model=model,
        prompt=user_prompt,
        schema=DraftOutput,
    )


async def _generate_with_validation(
    model: GenerativeModel,
    prompt: str,
    schema: type[T],
    max_retries: int = 1,
) -> T:
    """
    Generate structured output with validation. Retries once on Pydantic
    validation error, feeding the error back as additional context.
    """
    last_error: str | None = None

    for attempt in range(max_retries + 1):
        full_prompt = prompt
        if last_error:
            full_prompt += f"\n\nYour previous response failed validation:\n{last_error}\n\nPlease correct and respond with valid JSON matching the schema."

        try:
            response = await model.generate_content_async(
                full_prompt,
                generation_config={
                    "response_mime_type": "application/json",
                    "response_schema": schema,
                    "temperature": 0.7,
                },
            )
            return schema.model_validate_json(response.text)

        except ValidationError as e:
            last_error = str(e)
            logger.warning(
                f"Validation failed on attempt {attempt + 1}/{max_retries + 1}: {e}"
            )
            if attempt == max_retries:
                raise
        except json.JSONDecodeError as e:
            last_error = f"Invalid JSON: {e}"
            logger.warning(f"JSON decode failed on attempt {attempt + 1}: {e}")
            if attempt == max_retries:
                raise

    raise RuntimeError("Unreachable")  # for type checker


def _render_user_prompt(
    topic: str,
    research: ResearchOutput,
    voice: str,
    additional_constraints: list[str] | None,
) -> str:
    parts = [
        f"Topic: {topic}",
        f"Voice/style: {voice}",
        "",
        "Research findings:",
        *[f"  - {p}" for p in research.key_points],
    ]
    if additional_constraints:
        parts += ["", "Additional constraints (your previous draft failed these):"]
        parts += [f"  - {c}" for c in additional_constraints]
    return "\n".join(parts)
