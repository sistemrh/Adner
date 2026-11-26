"""Structural protocols for substituting fakes in place of AdnerSystem."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, List, Optional, Protocol

if TYPE_CHECKING:
    from adner.core.config import AdnerConfig
    from adner.core.events import EventBus
    from adner.engine._stubs import InferenceEngine
    from adner.security.capabilities import CapabilityPolicy
    from adner.sessions.session import SessionStore
    from adner.tools._stubs import BaseTool
    from adner.tools.storage._stubs import MemoryBackend
    from adner.traces.collector import TraceCollector
    from adner.traces.store import TraceStore


class OrchestratorDeps(Protocol):
    """Minimum surface of AdnerSystem that QueryOrchestrator depends on.

    Tests can satisfy this with a lightweight class — no need to construct
    the full AdnerSystem dataclass or materialize every subsystem.
    """

    config: AdnerConfig
    bus: EventBus
    engine: InferenceEngine
    engine_key: str
    model: str
    agent_name: str
    tools: List[BaseTool]
    memory_backend: Optional[MemoryBackend]
    capability_policy: Optional[CapabilityPolicy]
    rate_limiter: Optional[Any]
    session_store: Optional[SessionStore]
    trace_store: Optional[TraceStore]
    trace_collector: Optional[TraceCollector]  # written by _run_agent

    # Optional attribute (getattr with default) — declared for type clarity.
    _skill_few_shot_examples: Any
