"""Skill source resolvers — Hermes, OpenClaw, generic GitHub."""

from adner.skills.sources.base import ResolvedSkill, SourceResolver
from adner.skills.sources.github import GitHubResolver
from adner.skills.sources.hermes import HERMES_REPO_URL, HermesResolver
from adner.skills.sources.openclaw import OPENCLAW_REPO_URL, OpenClawResolver

__all__ = [
    "GitHubResolver",
    "HERMES_REPO_URL",
    "HermesResolver",
    "OPENCLAW_REPO_URL",
    "OpenClawResolver",
    "ResolvedSkill",
    "SourceResolver",
]
