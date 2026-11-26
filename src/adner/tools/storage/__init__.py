"""Storage primitive — persistent searchable storage."""

from __future__ import annotations

import importlib
import logging

# Always-available backend
import adner.tools.storage.sqlite  # noqa: F401
from adner.tools.storage._stubs import MemoryBackend, RetrievalResult
from adner.tools.storage.chunking import Chunk, ChunkConfig, chunk_text
from adner.tools.storage.context import ContextConfig, inject_context
from adner.tools.storage.ingest import ingest_path, read_document

logger = logging.getLogger(__name__)

# Optional backends — import to trigger registration
_OPTIONAL_STORAGE_BACKENDS = (
    "bm25",
    "faiss_backend",
    "colbert_backend",
    "hybrid",
    "dense",
)

for _backend in _OPTIONAL_STORAGE_BACKENDS:
    try:
        importlib.import_module(f"adner.tools.storage.{_backend}")
    except ImportError as _exc:
        logger.debug("Optional storage backend %s not loaded: %s", _backend, _exc)

__all__ = [
    "Chunk",
    "ChunkConfig",
    "ContextConfig",
    "MemoryBackend",
    "RetrievalResult",
    "chunk_text",
    "inject_context",
    "ingest_path",
    "read_document",
]
