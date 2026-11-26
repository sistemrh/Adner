"""Data source connectors for Deep Research."""

from adner.connectors._stubs import (
    Attachment,
    BaseConnector,
    Document,
    SyncStatus,
)
from adner.connectors.store import KnowledgeStore

__all__ = ["Attachment", "BaseConnector", "Document", "KnowledgeStore", "SyncStatus"]

# Auto-register built-in connectors
import adner.connectors.obsidian  # noqa: F401

try:
    import adner.connectors.gmail  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.gmail_imap  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.gdrive  # noqa: F401
except ImportError:
    pass  # httpx may not be installed

try:
    import adner.connectors.notion  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.granola  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.gcontacts  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.imessage  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.apple_notes  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.apple_music  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.apple_contacts  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.apple_calendar  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.slack_connector  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.outlook  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.imap  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.gcalendar  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.dropbox  # noqa: F401
except ImportError:
    pass  # httpx may not be installed

try:
    import adner.connectors.whatsapp  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.oura  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.apple_health  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.strava  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.spotify  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.google_tasks  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.weather  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.github_notifications  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.hackernews  # noqa: F401
except ImportError:
    pass

try:
    import adner.connectors.news_rss  # noqa: F401
except ImportError:
    pass
