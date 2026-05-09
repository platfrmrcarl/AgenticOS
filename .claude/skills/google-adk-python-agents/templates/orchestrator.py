# templates/orchestrator.py
# Canonical multi-agent pipeline orchestrator
# Pattern: orchestrator coordinates specialists, publisher gates output

from __future__ import annotations
import asyncio
from typing import Any
from uuid import UUID

from .schemas import (
    OrchestratorInput,
    OrchestratorOutput,
    ResearchOutput,
    DraftOutput,
    ImageOutput,
    PublishResult,
)
from .researcher import research
from .writer import write_draft
from .image_gen import generate_image
from .publisher import publish
from shared.persistence import (
    create_agent_run,
    update_agent_run,
    AgentRunStatus,
)


async def run(
    input_: OrchestratorInput,
    tenant_id: UUID,
    user_id: UUID | None = None,
) -> OrchestratorOutput:
    """Run the full pipeline. Persists agent_run to Postgres throughout."""

    run_id = await create_agent_run(
        tenant_id=tenant_id,
        user_id=user_id,
        agent_name="linkedin_post",
        input_=input_.model_dump(),
    )

    try:
        await update_agent_run(run_id, status=AgentRunStatus.RUNNING)

        # 1. Research — gather context in parallel where possible
        research_output: ResearchOutput = await research(
            topic=input_.topic,
            user_niche=input_.user_niche,
        )

        # 2. Draft + image generation in parallel
        draft_task = write_draft(
            topic=input_.topic,
            research=research_output,
            voice=input_.voice,
        )
        image_task = generate_image(prompt=input_.topic)

        draft, image = await asyncio.gather(draft_task, image_task)

        # 3. Publisher validates non-negotiables. If validation fails,
        #    re-invoke writer with failures as constraints (max 1 retry).
        publish_result: PublishResult = await publish(draft, image)

        if not publish_result.success and publish_result.errors:
            # Retry: feed validation failures back to writer as constraints
            draft = await write_draft(
                topic=input_.topic,
                research=research_output,
                voice=input_.voice,
                additional_constraints=publish_result.errors,
            )
            publish_result = await publish(draft, image)

        if not publish_result.success:
            await update_agent_run(
                run_id,
                status=AgentRunStatus.FAILED,
                error=f"Non-negotiables failed after retry: {publish_result.errors}",
            )
            return OrchestratorOutput(
                success=False,
                errors=publish_result.errors,
                run_id=run_id,
            )

        await update_agent_run(
            run_id,
            status=AgentRunStatus.COMPLETED,
            output=publish_result.model_dump(),
        )

        return OrchestratorOutput(
            success=True,
            post=publish_result.post,
            run_id=run_id,
        )

    except Exception as e:
        await update_agent_run(
            run_id,
            status=AgentRunStatus.FAILED,
            error=str(e),
        )
        raise
