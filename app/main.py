from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel

from . import db
from .voice import speak
from .ai import (
    build_system_prompt,
    chat,
    extract_event,
    extract_memory_facts,
)

app = FastAPI(title="Assistente Pessoal")

"""Voz: TTS via Piper open-source (app/voice.py), com fallback no navegador."""
STATIC = Path(__file__).resolve().parent.parent / "static"


class ChatIn(BaseModel):
    message: str


class EventIn(BaseModel):
    title: str
    event_date: str
    event_time: str | None = None
    repeat: str = "none"
    notes: str = ""


@app.on_event("startup")
def startup() -> None:
    db.init_db()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


# ---------------- Chat ----------------

@app.post("/api/chat")
def chat_endpoint(body: ChatIn) -> dict:
    text = body.message.strip()
    low = text.lower()
    db.save_message("user", text)

    for fact in extract_memory_facts(text):
        db.remember("fato", fact)

    saved = None
    if any(k in low for k in ("agenda", "agendar", "marca", "anota", "compromisso", "lembra")) and extract_event(text):
        ev = extract_event(text)
        saved = db.add_event(ev["title"], ev["event_date"], ev["event_time"], ev["repeat"])
        text += f"\n(Sistema: compromisso anotado automaticamente: {saved})"

    if "minha agenda" in low or low in ("agenda", "compromissos"):
        events = db.list_events(only_future=True)
        if not events:
            reply = "Você não tem compromissos futuros anotados. Quer que eu anote algum?"
        else:
            lines = [
                f"• {e['event_date']}{' às ' + e['event_time'] if e['event_time'] else ''} — {e['title']}"
                for e in events[:15]
            ]
            reply = "📅 Sua agenda:\n" + "\n".join(lines)
        provider = "local"
    elif "minha rotina" in low or low == "rotina":
        reply = format_routine(db.analyze_routine())
        provider = "local"
    else:
        messages = [{"role": "system", "content": build_system_prompt(db.analyze_routine(), db.list_memories(), db.list_events(only_future=True))}]
        messages += db.recent_messages(10)
        messages.append({"role": "user", "content": text})
        reply, provider = chat(messages)

    db.save_message("assistant", reply)
    return {"reply": reply, "provider": provider, "saved_event": saved, "memories": db.list_memories(5)}


# ---------------- Events ----------------

@app.get("/api/events")
def events(only_future: bool = True) -> list[dict]:
    return db.list_events(only_future)


@app.post("/api/events")
def create_event(body: EventIn) -> dict:
    return db.add_event(body.title, body.event_date, body.event_time, body.repeat, body.notes)


@app.delete("/api/events/{event_id}")
def remove_event(event_id: int) -> dict:
    return {"deleted": db.delete_event(event_id)}


# ---------------- Voice (TTS, Piper open-source) ----------------

@app.get("/api/tts")
def tts(text: str) -> Response:
    audio = speak(text)
    if not audio:
        return Response(status_code=503)
    return Response(content=audio, media_type="audio/wav")


# ---------------- Routine & memory ----------------

@app.get("/api/routine")
def routine() -> dict:
    return db.analyze_routine()


@app.get("/api/memories")
def memories() -> list[dict]:
    return db.list_memories()


def format_routine(rot: dict) -> str:
    if rot["total_events"] == 0:
        return "Ainda não tenho compromissos suficientes para aprender sua rotina. Anote alguns e eu descubro seus padrões! 📊"
    parts = [f"📊 Análise de rotina com base em {rot['total_events']} compromisso(s):"]
    if rot["busiest_weekday"]:
        parts.append(f"• Dia mais movimentado: **{rot['busiest_weekday']}**")
    if rot["peak_hour"]:
        parts.append(f"• Horário de pico: **{rot['peak_hour']}**")
    if rot["recurring"]:
        names = ", ".join(p["title"] for p in rot["recurring"][:5])
        parts.append(f"• Atividades recorrentes: {names}")
    nxt = rot["next_7_days"][:5]
    if nxt:
        parts.append("• Próximos 7 dias: " + "; ".join(f"{e['title']} ({e['event_date']})" for e in nxt))
    return "\n".join(parts)
