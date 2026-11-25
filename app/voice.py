import os
import urllib.parse
import urllib.request

PIPER_URL = os.getenv("PIPER_URL", "http://localhost:5000")
PIPER_VOICE = os.getenv("PIPER_VOICE", "pt_BR-faber-medium")
TTS_TIMEOUT = float(os.getenv("TTS_TIMEOUT", "20"))


def speak(text: str) -> bytes | None:
    """Synthesize speech with local Piper (open-source). Returns WAV bytes or None."""
    if not text.strip():
        return None
    url = (
        f"{PIPER_URL}/api/tts"
        f"?text={urllib.parse.quote(text[:1500])}&voice={urllib.parse.quote(PIPER_VOICE)}"
    )
    try:
        with urllib.request.urlopen(url, timeout=TTS_TIMEOUT) as resp:
            audio = resp.read()
        return audio or None
    except Exception:
        return None
