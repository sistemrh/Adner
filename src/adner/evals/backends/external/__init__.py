"""External-framework subprocess backends (Hermes Agent, OpenClaw)."""

from adner.evals.backends.external.hermes_agent import HermesBackend
from adner.evals.backends.external.openclaw import OpenClawBackend

__all__ = ["HermesBackend", "OpenClawBackend"]
