import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "assistente.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                event_date TEXT NOT NULL,
                event_time TEXT,
                repeat TEXT NOT NULL DEFAULT 'none',
                notes TEXT,
                created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                content TEXT NOT NULL,
                count INTEGER NOT NULL DEFAULT 1,
                updated_at TEXT NOT NULL,
                UNIQUE(kind, content)
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


# ---------------- Events ----------------

def add_event(title: str, event_date: str, event_time: str | None, repeat: str = "none", notes: str = "") -> dict:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO events (title, event_date, event_time, repeat, notes, created_at) VALUES (?,?,?,?,?,?)",
            (title, event_date, event_time, repeat, notes, now_iso()),
        )
        row = conn.execute("SELECT * FROM events WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def list_events(only_future: bool = False) -> list[dict]:
    query = "SELECT * FROM events"
    if only_future:
        query += f" WHERE event_date >= date('{datetime.now():%Y-%m-%d}')"
    query += " ORDER BY event_date, COALESCE(event_time, '23:59')"
    with get_conn() as conn:
        return [dict(r) for r in conn.execute(query).fetchall()]


def delete_event(event_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM events WHERE id = ?", (event_id,))
        return cur.rowcount > 0


# ---------------- Memories ----------------

def remember(kind: str, content: str) -> None:
    content = content.strip()
    if not content:
        return
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO memories (kind, content, count, updated_at)
            VALUES (?, ?, 1, ?)
            ON CONFLICT(kind, content)
            DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
            """,
            (kind, content, now_iso()),
        )


def list_memories(limit: int = 30) -> list[dict]:
    with get_conn() as conn:
        return [
            dict(r)
            for r in conn.execute(
                "SELECT * FROM memories ORDER BY count DESC, updated_at DESC LIMIT ?", (limit,)
            ).fetchall()
        ]


# ---------------- Messages ----------------

def save_message(role: str, content: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (role, content, created_at) VALUES (?,?,?)",
            (role, content, now_iso()),
        )


def recent_messages(limit: int = 12) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT role, content FROM messages ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


# ---------------- Routine ----------------

def _enriched_occurrences(event: dict, days_back: int = 60) -> list[str]:
    """Resolve an event into concrete dates, expanding weekly repeats over the past window."""
    start = datetime.strptime(event["event_date"], "%Y-%m-%d").date()
    today = datetime.now().date()
    if event["repeat"] == "weekly":
        dates, cursor = [], start
        while cursor <= today:
            dates.append(cursor.isoformat())
            cursor += timedelta(days=7)
        return dates
    return [start.isoformat()]


def analyze_routine() -> dict:
    events = list_events()
    today = datetime.now().date()
    per_weekday: dict[int, int] = {}
    per_hour: dict[int, int] = {}
    by_title: dict[str, list[str]] = {}

    for ev in events:
        for date_str in _enriched_occurrences(ev):
            d = datetime.strptime(date_str, "%Y-%m-%d").date()
            per_weekday[d.weekday()] = per_weekday.get(d.weekday(), 0) + 1
            if ev["event_time"]:
                hour = int(str(ev["event_time"])[:2])
                per_hour[hour] = per_hour.get(hour, 0) + 1
            by_title.setdefault(ev["title"], []).append(date_str)

    weekdays = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
    busiest = max(per_weekday, key=per_weekday.get) if per_weekday else None
    peak_hour = max(per_hour, key=per_hour.get) if per_hour else None

    patterns = [
        {
            "title": title,
            "occurrences": len(dates),
            "last": max(dates),
            "is_recurring": len(dates) >= 3 or any(e["repeat"] == "weekly" and e["title"] == title for e in events),
        }
        for title, dates in by_title.items()
    ]
    patterns.sort(key=lambda p: p["occurrences"], reverse=True)

    next_7 = [
        e
        for e in list_events(only_future=True)
        if e["event_date"] <= (today + timedelta(days=7)).isoformat()
    ]

    return {
        "total_events": len(events),
        "busiest_weekday": weekdays[busiest] if busiest is not None else None,
        "peak_hour": f"{peak_hour:02d}h" if peak_hour is not None else None,
        "recurring": [p for p in patterns if p["is_recurring"]],
        "top_activities": patterns[:5],
        "next_7_days": [],
    } | {"next_7_days": next_7}
