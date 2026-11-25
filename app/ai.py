import json
import os
import re
import urllib.error
import urllib.request

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
REQUEST_TIMEOUT = float(os.getenv("AI_TIMEOUT", "60"))


class AIDisabled(Exception):
    pass


def _post_json(url: str, payload: dict, headers: dict | None = None) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"} | (headers or {}),
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        return json.loads(resp.read().decode())


def _ollama(messages: list[dict]) -> str:
    data = _post_json(
        f"{OLLAMA_URL}/api/chat",
        {"model": OLLAMA_MODEL, "messages": messages, "stream": False},
    )
    text = data.get("message", {}).get("content", "").strip()
    if not text:
        raise AIDisabled("Ollama respondeu vazio")
    return text


def _ollama_available() -> bool:
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=2) as resp:
            return bool(json.loads(resp.read().decode()).get("models"))
    except Exception:
        return False


def _groq(messages: list[dict]) -> str:
    if not GROQ_API_KEY:
        raise AIDisabled("GROQ_API_KEY não configurada")
    try:
        data = _post_json(
            "https://api.groq.com/openai/v1/chat/completions",
            {"model": GROQ_MODEL, "messages": messages, "temperature": 0.6},
            headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        )
    except urllib.error.HTTPError as e:
        raise AIDisabled(f"Groq retornou {e.code}") from e
    text = data["choices"][0]["message"]["content"].strip()
    if not text:
        raise AIDisabled("Groq respondeu vazio")
    return text


def chat(messages: list[dict]) -> tuple[str, str]:
    """Return (reply, provider). Falls back through providers."""
    if _ollama_available():
        try:
            return _ollama(messages), f"ollama:{OLLAMA_MODEL}"
        except (AIDisabled, OSError, KeyError):
            pass
    try:
        return _groq(messages), f"groq:{GROQ_MODEL}"
    except (AIDisabled, OSError, KeyError, urllib.error.URLError):
        return offline_reply(messages), "offline"


_MONTHS = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5, "junho": 6,
    "julho": 7, "agosto": 8, "setembro": 9, "outubro": 10, "novembro": 11, "dezembro": 12,
}
_WEEKDAYS = {"segunda": 0, "terça": 1, "terca": 1, "quarta": 2, "quinta": 3, "sexta": 4, "sábado": 5, "sabado": 5, "domingo": 6}


def _parse_date(text: str) -> str | None:
    today = __import__("datetime").date.today()
    low = text.lower()
    if "amanhã" in low or "amanha" in low:
        return (today + __import__("datetime").timedelta(days=1)).isoformat()
    if "hoje" in low:
        return today.isoformat()
    m = re.search(r"(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?", low)
    if m:
        day, month = int(m.group(1)), int(m.group(2))
        year = int(m.group(3)) if m.group(3) else today.year
        if year < 100:
            year += 2000
        try:
            return __import__("datetime").date(year, month, day).isoformat()
        except ValueError:
            return None
    for name, num in _MONTHS.items():
        d = re.search(rf"(\d{{1,2}})\s+(?:de\s+)?{name}", low)
        if d:
            try:
                return __import__("datetime").date(today.year, num, int(d.group(1))).isoformat()
            except ValueError:
                continue
    for name, num in _WEEKDAYS.items():
        if re.search(rf"\b{name}\b", low):
            delta = (num - today.weekday()) % 7 or 7
            return (today + __import__("datetime").timedelta(days=delta)).isoformat()
    return None


def _parse_time(text: str) -> str | None:
    m = re.search(r"(\d{1,2})[:h](\d{2})", text)
    if m:
        return f"{int(m.group(1)):02d}:{m.group(2)}"
    m = re.search(r"\b(\d{1,2})\s*(?:h|horas?)\b", text.lower())
    if m:
        return f"{int(m.group(1)):02d}:00"
    return None


def extract_event(text: str) -> dict | None:
    """Best-effort local extraction of an appointment from a Portuguese sentence."""
    low = text.lower()
    if not any(k in low for k in ("agenda", "marcar", "anotar", "compromisso", "reunião", "reuniao", "consulta", "lembrete", "médico", "medico", "dentista", "aula", "reunião")):
        return None
    date = _parse_date(text)
    time = _parse_time(text)
    weekday = next((n for n in _WEEKDAYS if re.search(rf"todo\s+{n}\b", low)), "none")
    if not (date or time):
        return None
    title = re.sub(
        r"(me\s+)?(anotar|anota[rs]?|marcar|marca[rs]?|agendar|agenda[rs]?|lembrar|lembra[rs]?)\s*(?:\b(me|a|o|que|de)\b)?\s*",
        "", text, flags=re.IGNORECASE,
    ).strip(" ,.!?")
    title = re.split(r"\b(amanhã|amanha|hoje|às|as|no dia|dia)\b", title, maxsplit=1)[0].strip()
    title = re.sub(
        r"^(?:eu\s+)?(?:tenho\s+que|preciso\s+(?:de\s+|que\s+)?|quero|queria|vou|gostaria\s+de)\s*",
        "", title, flags=re.IGNORECASE,
    ).strip(" ,.!")
    if not title:
        return None
    return {
        "title": title[:80] or "Compromisso",
        "event_date": date or __import__("datetime").date.today().isoformat(),
        "event_time": time,
        "repeat": "weekly" if weekday != "none" else "none",
    }


def extract_memory_facts(text: str) -> list[str]:
    facts = []
    for pattern in (r"meu nome (?:é|e) ([A-ZÀ-Ú][\wÀ-ú]+(?: [A-ZÀ-Ú][\wÀ-ú]+){0,2})",
                    r"eu (?:trabalho|estudo) (?:na|no|em) ([\wÀ-ú ]{3,40})",
                    r"eu gosto de ([\wÀ-ú ]{3,40})"):
        m = re.search(pattern, text, flags=re.IGNORECASE)
        if m:
            facts.append(m.group(0)[:120].strip())
    return facts


GUIA = (
    "Sou seu assistente pessoal 🤖 Estou no modo offline (sem Ollama e sem Groq), "
    "mas ainda consigo:\n"
    "• **Anotar compromissos** — ex.: \"marcar dentista amanhã às 14h\"\n"
    "• **Listar agenda** — escreva \"minha agenda\"\n"
    "• **Rotina** — escreva \"minha rotina\"\n"
    "Para conversas completas, inicie o Ollama (`ollama serve`) ou configure "
    "`GROQ_API_KEY` no arquivo .env e reinicie."
)


def offline_reply(messages: list[dict]) -> str:
    text = messages[-1]["content"].lower()
    if any(k in text for k in ("agenda", "compromisso", "o que tenho")):
        return "Escreva apenas \"minha agenda\" que eu listo seus compromissos aqui no painel ao lado. 📅"
    if "rotina" in text:
        return "Escreva \"minha rotina\" que eu analiso seus horários e mostro seus padrões. 📊"
    return GUIA


def build_system_prompt(routine: dict, memories: list[dict], events: list[dict]) -> str:
    from datetime import date
    mem_txt = "\n".join(f"- ({m['count']}x) {m['content']}" for m in memories[:8]) or "Nada ainda."
    ev_txt = "\n".join(
        f"- {e['event_date']}{' ' + e['event_time'] if e['event_time'] else ''}"
        f"{' (semanal)' if e['repeat'] == 'weekly' else ''}: {e['title']}"
        for e in events[:10]
    ) or "Nenhum."
    rot_txt = json.dumps(
        {k: routine[k] for k in ("busiest_weekday", "peak_hour", "recurring")},
        ensure_ascii=False,
    )
    return (
        "Você é um assistente pessoal em português, caloroso e objetivo. "
        f"Hoje é {date.today().isoformat()}.\n"
        f"== O que você sabe sobre a pessoa ==\n{mem_txt}\n"
        f"== Próximos compromissos ==\n{ev_txt}\n"
        f"== Rotina detectada ==\n{rot_txt}\n"
        "Use essas informações para responder de forma pessoal e útil. "
        "Se a pessoa pedir para anotar/marcar algo, confirme que foi anotado. "
        "Responda em no máximo 4 frases, a menos que peçam detalhes."
    )
