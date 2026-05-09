# templates/non-negotiables.py
# The validation guard pattern that gates publisher output
# Every user-facing agent output passes through validate_non_negotiables()

from __future__ import annotations
from dataclasses import dataclass
from typing import Protocol


@dataclass
class ValidationFailure:
    rule: str
    message: str
    suggestion: str  # How the writer should fix it on retry


class HasContent(Protocol):
    """Anything with text content that can be validated."""
    hook: str
    body: str
    cta: str


# =============================================================================
# RULE FUNCTIONS — each returns ValidationFailure | None
# =============================================================================

def check_hook_specific(content: HasContent) -> ValidationFailure | None:
    """Hook must include specificity, contrast, or curiosity gap."""
    hook = content.hook.strip()
    generic_starters = [
        "are you", "have you ever", "let me tell you", "in today's",
        "in this post", "i wanted to share", "here's a thought",
    ]
    if any(hook.lower().startswith(g) for g in generic_starters):
        return ValidationFailure(
            rule="hook_specific",
            message=f"Hook starts generically: '{hook[:50]}...'",
            suggestion="Open with a specific number, contrast, or curiosity gap. Avoid generic openers.",
        )
    if len(hook) < 20:
        return ValidationFailure(
            rule="hook_length",
            message="Hook too short to be engaging",
            suggestion="Hook should be at least 20 chars and convey something interesting.",
        )
    return None


def check_cta_engaging(content: HasContent) -> ValidationFailure | None:
    """CTA must invite a response, not just announce."""
    cta = content.cta.strip().lower()
    if not any(t in cta for t in ["?", "share", "comment", "thoughts", "agree", "what do you", "tell me"]):
        return ValidationFailure(
            rule="cta_engaging",
            message="CTA does not invite a response",
            suggestion="End with a question, ask for thoughts, or invite sharing.",
        )
    return None


def check_body_substantive(content: HasContent, min_chars: int = 200) -> ValidationFailure | None:
    """Body must be substantive enough to deliver on the hook."""
    if len(content.body) < min_chars:
        return ValidationFailure(
            rule="body_length",
            message=f"Body too short ({len(content.body)} chars, need {min_chars}+)",
            suggestion=f"Expand the body to at least {min_chars} characters with concrete details.",
        )
    return None


# =============================================================================
# VALIDATOR
# =============================================================================

def validate_non_negotiables(content: HasContent) -> list[ValidationFailure]:
    """
    Run all non-negotiable checks. Empty list = passes.
    Add new rules here as they're discovered.
    """
    rules = [
        check_hook_specific,
        check_cta_engaging,
        check_body_substantive,
    ]
    failures = []
    for rule in rules:
        failure = rule(content)
        if failure:
            failures.append(failure)
    return failures


def failures_as_constraints(failures: list[ValidationFailure]) -> list[str]:
    """Format failures as natural-language constraints for retry prompts."""
    return [f"{f.message}. {f.suggestion}" for f in failures]
