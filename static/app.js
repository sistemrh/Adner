const $ = (id) => document.getElementById(id);
const messagesEl = $("messages");

function addMsg(text, cls) {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.textContent = text;
  div.innerHTML = div.innerHTML.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

/* ---------------- Voz: TTS (Piper open-source → navegador) ---------------- */

let piperAvailable = true;
let voicesReady = false;
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = () => { voicesReady = true; };
}

function cleanForSpeech(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}•📝📅📊🧠🤖🔊🎤]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function browserSpeak(text) {
  if (!("speechSynthesis" in window)) {
    $("voice-status").textContent = "voz: indisponível neste navegador";
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 1.02;
  const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("pt"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

async function speak(text) {
  if (!$("auto-speak").checked) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  if (piperAvailable) {
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(clean)}`);
      if (res.ok) {
        new Audio(URL.createObjectURL(await res.blob())).play();
        $("voice-status").textContent = "voz: Piper (open-source, local)";
        return;
      }
      if (res.status === 503) {
        piperAvailable = false;
        $("voice-status").textContent = "voz: navegador (instale o Piper para voz open-source)";
      }
    } catch { /* usa navegador */ }
  }
  browserSpeak(clean);
}

/* ---------------- Ditado (STT do navegador, grátis) ---------------- */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;

if (SR) {
  rec = new SR();
  rec.lang = "pt-BR";
  rec.interimResults = false;
  rec.onresult = (e) => {
    $("chat-input").value = e.results[0][0].transcript;
    $("chat-form").dispatchEvent(new Event("submit", { cancelable: true }));
  };
  rec.onend = () => $("mic-btn").classList.remove("listening");
  rec.onerror = () => $("mic-btn").classList.remove("listening");
}

$("mic-btn").addEventListener("click", () => {
  if (!rec) {
    alert("Ditado por voz não é suportado neste navegador. Use Chrome ou Edge, ou digite sua mensagem.");
    return;
  }
  if ($("mic-btn").classList.contains("listening")) {
    rec.stop();
    return;
  }
  $("mic-btn").classList.add("listening");
  rec.start();
});

/* ---------------- Chat e painel ---------------- */

async function refreshSide() {
  const [events, routine, memories] = await Promise.all([
    fetch("/api/events").then(r => r.json()),
    fetch("/api/routine").then(r => r.json()),
    fetch("/api/memories").then(r => r.json()),
  ]);

  const ul = $("events");
  if (events.length) {
    ul.innerHTML = "";
    events.forEach(ev => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${ev.title}<br><small style="color:var(--muted)">${ev.event_date}${ev.event_time ? " " + ev.event_time : ""}${ev.repeat === "weekly" ? " · semanal" : ""}</small></span><span class="del" title="remover">✕</span>`;
      li.querySelector(".del").onclick = async () => {
        await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
        refreshSide();
      };
      ul.appendChild(li);
    });
  } else {
    ul.innerHTML = "<li style='color:var(--muted)'>Nenhum compromisso</li>";
  }

  const r = routine;
  let rt = "";
  if (r.total_events === 0) rt = "Anote compromissos para eu aprender sua rotina.";
  else {
    if (r.busiest_weekday) rt += `Dia mais movimentado: ${r.busiest_weekday}\n`;
    if (r.peak_hour) rt += `Horário de pico: ${r.peak_hour}\n`;
    if (r.recurring?.length) rt += `Recorrentes: ${r.recurring.map(p => p.title).join(", ")}\n`;
    if (r.next_7_days?.length) rt += `Próx. 7 dias: ${r.next_7_days.length} compromisso(s)`;
  }
  $("routine").textContent = rt || "—";

  $("memories").textContent =
    memories.length ? memories.map(m => `${m.content} (${m.count}x)`).join("\n") : "Ainda não aprendi nada sobre você.";
}

$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg(text, "user");
  const thinking = addMsg("digitando…", "bot");
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    const data = await res.json();
    thinking.textContent = data.reply;
    thinking.innerHTML = thinking.innerHTML.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    $("provider").textContent = `IA: ${data.provider}`;
    speak(data.reply);
    refreshSide();
  } catch {
    thinking.textContent = "Ops, erro de conexão com o servidor.";
  }
  messagesEl.scrollTop = messagesEl.scrollHeight;
});

$("event-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: $("ev-title").value,
      event_date: $("ev-date").value,
      event_time: $("ev-time").value || null,
      repeat: $("ev-repeat").checked ? "weekly" : "none",
    }),
  });
  $("ev-title").value = "";
  refreshSide();
});

refreshSide();
