from app.phases.brain_dump import build_brain_dump_prompt
from app.phases.domain_locking import build_domain_locking_prompt
from app.phases.skill_surfacing import build_skill_surfacing_prompt
from app.phases.automation_triage import build_triage_prompt
from app.phases.deliverable import build_deliverable_prompt


def test_brain_dump_prompt_contains_instructions():
    prompt = build_brain_dump_prompt()
    assert "brain dump" in prompt.lower()
    assert "20" in prompt


def test_domain_locking_prompt_contains_domain_instruction():
    prompt = build_domain_locking_prompt(brain_dump=["write emails", "review code"])
    assert "domain" in prompt.lower()
    assert "3" in prompt or "five" in prompt.lower() or "5" in prompt


def test_skill_surfacing_prompt_includes_domain():
    prompt = build_skill_surfacing_prompt(domain="client delivery")
    assert "client delivery" in prompt


def test_triage_prompt_includes_skill():
    prompt = build_triage_prompt(skill_name="draft sponsor reply")
    assert "draft sponsor reply" in prompt
    assert "frequency" in prompt.lower() or "often" in prompt.lower()


def test_deliverable_prompt_includes_domains_and_skills():
    domains = [{"name": "content", "successVision": "automated"}]
    skills = [{"domainName": "content", "skills": [{"name": "draft post", "description": "writes post"}]}]
    prompt = build_deliverable_prompt(domains=domains, skills=skills)
    assert "CLAUDE.md" in prompt
    assert "content" in prompt
