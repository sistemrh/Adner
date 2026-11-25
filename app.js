const $ = (id) => document.getElementById(id);
const messagesEl = $("messages");

/* ================= Armazenamento local (funciona no GitHub Pages) ================= */

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

const getEvents = () => store.get("adner_events", []);
const getMemories = () => store.get("adner_memories", []);

function addEvent({ title, event_date, event_time = null, repeat = "none" }) {
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return { error: "title e event_date (AAAA-MM-DD) são obrigatórios" };
  const ev = { id: Date.now(), title, event_date, event_time, repeat: repeat === "weekly" ? "weekly" : "none" };
  store.set("adner_events", [...getEvents(), ev]);
  refreshSide();
  return { ok: true, event: ev };
}

function deleteEvent(id) {
  const remaining = getEvents().filter(e => e.id !== Number(id));
  store.set("adner_events", remaining);
  refreshSide();
  return { ok: remaining.length !== getEvents().length };
}

function futureEvents() {
  const today = new Date().toISOString().slice(0, 10);
  return getEvents()
    .filter(e => e.event_date >= today)
    .sort((a, b) => (a.event_date + (a.event_time || "23:59")).localeCompare(b.event_date + (b.event_time || "23:59")));
}

function rememberFact(fact) {
  if (!fact || typeof fact !== "string" || fact.trim().length < 2) return { error: "fact inválido" };
  const memories = getMemories();
  const found = memories.find(m => m.content.toLowerCase() === fact.trim().toLowerCase());
  if (found) { found.count += 1; found.updated_at = new Date().toISOString(); }
  else memories.push({ content: fact.trim(), count: 1, updated_at: new Date().toISOString() });
  store.set("adner_memories", memories);
  refreshSide();
  return { ok: true };
}

function forgetFact(fact) {
  const memories = getMemories().filter(m => m.content.toLowerCase() !== String(fact).toLowerCase());
  store.set("adner_memories", memories);
  refreshSide();
  return { ok: true };
}

function analyzeRoutine() {
  const weekdays = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const perWeekday = {}, perHour = {}, byTitle = {};
  for (const ev of getEvents()) {
    const d = new Date(ev.event_date + "T12:00:00");
    const dates = [];
    if (ev.repeat === "weekly") {
      const cursor = new Date(d);
      const end = new Date();
      while (cursor <= end) { dates.push(new Date(cursor).getDay()); cursor.setDate(cursor.getDate() + 7); }
    } else dates.push(d.getDay());
    for (const wd of dates) perWeekday[wd] = (perWeekday[wd] || 0) + 1;
    if (ev.event_time) { const h = parseInt(ev.event_time.slice(0, 2), 10); perHour[h] = (perHour[h] || 0) + 1; }
    byTitle[ev.title] = (byTitle[ev.title] || 0) + dates.length;
  }
  const top = (obj) => Object.keys(obj).length ? Object.entries(obj).sort((a, b) => b[1] - a[1])[0] : null;
  const bw = top(perWeekday), ph = top(perHour);
  const recurring = Object.entries(byTitle).filter(([, n]) => n >= 3).map(([t]) => t);
  return {
    total_events: getEvents().length,
    busiest_weekday: bw ? weekdays[+bw[0]] : null,
    peak_hour: ph ? `${ph[0]}h` : null,
    recurring,
    recurring_counts: byTitle,
  };
}

/* ================= Ferramentas do agente (function calling) ================= */

const TOOLS = [
  { type: "function", function: { name: "add_event", description: "Anota um compromisso na agenda do usuário. Use para qualquer pedido de marcar/agendar/anotar compromisso.", parameters: { type: "object", properties: { title: { type: "string", description: "Título curto do compromisso" }, event_date: { type: "string", description: "Data em AAAA-MM-DD" }, event_time: { type: "string", description: "Hora em HH:MM ou null" }, repeat: { type: "string", enum: ["none", "weekly"], description: "Repete toda semana?" } }, required: ["title", "event_date"] } } },
  { type: "function", function: { name: "list_events", description: "Lista os próximos compromissos agendados.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "delete_event", description: "Remove um compromisso pelo id.", parameters: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } } },
  { type: "function", function: { name: "remember_fact", description: "Memoriza um fato sobre o usuário (nome, trabalho, gostos, preferências, etc.) para uso futuro.", parameters: { type: "object", properties: { fact: { type: "string" } }, required: ["fact"] } } },
  { type: "function", function: { name: "forget_fact", description: "Esquece um fato memorizado anteriormente.", parameters: { type: "object", properties: { fact: { type: "string" } }, required: ["fact"] } } },
  { type: "function", function: { name: "analyze_routine", description: "Analisa a agenda do usuário e retorna padrões de rotina (dia mais cheio, horário de pico, atividades recorrentes).", parameters: { type: "object", properties: {} } } },
];

function runTool(name, args) {
  switch (name) {
    case "add_event": return addEvent(args);
    case "list_events": return { events: futureEvents().slice(0, 30) };
    case "delete_event": return deleteEvent(args.id);
    case "remember_fact": return rememberFact(args.fact);
    case "forget_fact": return forgetFact(args.fact);
    case "analyze_routine": return analyzeRoutine();
    default: return { error: `ferramenta desconhecida: ${name}` };
  }
}

function buildSystemPrompt() {
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const rot = analyzeRoutine();
  const mem = getMemories().slice(0, 10).map(m => `- (${m.count}x) ${m.content}`).join("\n") || "Nada ainda.";
  const evs = futureEvents().slice(0, 10).map(e => `- ${e.event_date}${e.event_time ? " " + e.event_time : ""}${e.repeat === "weekly" ? " (semanal)" : ""}: ${e.title}`).join("\n") || "Nenhum.";
  return (
    `Você é o Adner, um assistente pessoal em português, pró-ativo e objetivo. ` +
    `Hoje é ${weekdays[now.getDay()]}, ${today}\n\n` +
    `== O que você sabe sobre a pessoa ==\n${mem}\n\n` +
    `== Próximos compromissos ==\n${evs}\n\n` +
    `== Rotina detectada ==\n${JSON.stringify({ busiest_weekday: rot.busiest_weekday, peak_hour: rot.peak_hour, recurring: rot.recurring })}\n\n` +
    `REGRAS:\n` +
    `- Sempre que o usuário pedir para marcar/anotar/agendar algo, USE a ferramenta add_event e confirme.\n` +
    `- Quando o usuário contar algo pessoal (nome, trabalho, gostos), USE remember_fact.\n` +
    `- Para perguntas sobre agenda, USE list_events. Para rotina, USE analyze_routine.\n` +
    `- Responda em no máximo 4 frases, a menos que peçam detalhes. `
  );
}

/* ================= Provedores de IA ================= */

const DEFAULTS = { groq: { model: "llama-3.3-70b-versatile", base: "https://api.groq.com/openai/v1" }, ollama: { model: "llama3.2", base: "http://localhost:11434/v1" } };

function activeProvider() {
  const p = localStorage.getItem("adner_provider") || "groq";
  const key = store.get("adner_key", "");
  const model = localStorage.getItem("adner_model") || DEFAULTS[p].model;
  return { name: p, base: DEFAULTS[p].base, key, model };
}

function providerReady() {
  const p = activeProvider();
  return p.name === "ollama" || !!p.key;
}

async function chatCompletion(messages) {
  const p = activeProvider();
  const headers = { "Content-Type": "application/json" };
  if (p.key) headers.Authorization = `Bearer ${p.key}`;
  const res = await fetch(`${p.base}/chat/completions`, {
    method: "POST", headers,
    body: JSON.stringify({ model: p.model, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.6 }),
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).choices[0].message;
}

async function agentLoop(conversationHistory) {
  const messages = [{ role: "system", content: buildSystemPrompt() }, ...conversationHistory];
  for (let i = 0; i < 4; i++) {
    const msg = await chatCompletion(messages);
    messages.push(msg);
    if (!msg.tool_calls) return msg.content;
    for (const call of msg.tool_calls) {
      let result;
      try { result = runTool(call.function.name, JSON.parse(call.function.arguments || "{}")); }
      catch (e) { result = { error: String(e) }; }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return "Fiz o que pude na agenda — mas não consegui finalizar a resposta. Tente reformular.";
}

/* ================= Fallback offline (sem chave) ================= */

function parseDate(text) {
  const today = new Date();
  const low = text.toLowerCase();
  const iso = (d) => d.toISOString().slice(0, 10);
  if (/amanh/.test(low)) { const d = new Date(today); d.setDate(d.getDate() + 1); return iso(d); }
  const dmy = low.match(/(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/);
  if (dmy) { const y = dmy[3] ? (+dmy[3] < 100 ? 2000 + +dmy[3] : +dmy[3]) : today.getFullYear(); return new Date(Date.UTC(y, dmy[2] - 1, dmy[1])).toISOString().slice(0, 10); }
  const wd = { domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6 };
  for (const [name, num] of Object.entries(wd)) {
    if (new RegExp(`\\b${name}\\b`).test(low)) {
      const d = new Date(today);
      d.setDate(d.getDate() + ((num - d.getDay() + 7) % 7 || 7));
      return iso(d);
    }
  }
  return null;
}

function parseTime(text) {
  const m = text.match(/(\d{1,2})[:h](\d{2})/) || text.toLowerCase().match(/\b(\d{1,2})\s*h(?:oras?)?\b/);
  if (!m) return null;
  return `${String(+m[1]).padStart(2, "0")}:${m[2] !== undefined ? m[2] : "00"}`;
}

function offlineAgent(text) {
  const low = text.toLowerCase();
  if (/minha agenda|^agenda|compromissos/.test(low)) {
    const evs = futureEvents();
    return evs.length ? "📅 Sua agenda:\n" + evs.slice(0, 15).map(e => `• ${e.event_date}${e.event_time ? " às " + e.event_time : ""} — ${e.title}`).join("\n") : "Você não tem compromissos futuros. Peça para eu anotar um!\n";
  }
  if (/minha rotina|^rotina/.test(low)) {
    const r = analyzeRoutine();
    if (!r.total_events) return "Anote compromissos para eu aprender sua rotina. 📊";
    return `📊 Rotina:\n${r.busiest_weekday ? `• Dia mais cheio: ${r.busiest_weekday}\n` : ""}${r.peak_hour ? `• Horário de pico: ${r.peak_hour}\n` : ""}${r.recurring.length ? `• Recorrentes: ${r.recurring.join(", ")}` : ""}`;
  }
  if (/marcar|marca|agendar|anota|anotar|agenda|lembra/.test(low)) {
    const date = parseDate(text), time = parseTime(text);
    if (date || time) {
      const title = text.replace(/(me\s+)?(anote?r?|marque?r?|agende?r?|lembre?r?)\s*/i, "").split(/amanh|hoje|às|as\b|no dia|dia/i)[0].trim() || "Compromisso";
      const ev = addEvent({ title, event_date: date || new Date().toISOString().slice(0, 10), event_time: time });
      if (ev.ok) return `✅ Anotado: **${ev.event.title}** em ${ev.event.event_date}${ev.event.event_time ? " às " + ev.event.event_time : ""}.\nConfigure a chave da Groq (grátis) para conversar comigo de verdade! ⚙️`;
    }
  }
  return "Para conversar comigo de verdade, cole uma chave GRÁTIS da Groq nas configurações ⚙️ ao lado (levará 1 minuto em console.groq.com/keys). Enquanto isso eu consigo: listar agenda (\"minha agenda\"), rotina (\"minha rotina\") e anotar_datas simples (\"marcar dentista amanhã às 14h\").";
}

/* ================= UI ================= */

function addMsg(text, cls) {
  const div = document.createElement("div");
  div.className = `msg ${cls}`;
  div.textContent = text;
  div.innerHTML = div.innerHTML.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

function cleanForSpeech(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}•]/gu, "").replace(/\s+/g, " ").trim();
}

function browserSpeak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 1.02;
  const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith("pt"));
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
}

/* ---------- Kokoro 82M: TTS open-source (Apache-2.0) rodando no navegador ---------- */

const KOKORO = { model: "onnx-community/Kokoro-82M-v1.0-ONNX", tts: null, loading: null };

async function loadKokoro() {
  if (KOKORO.tts) return KOKORO.tts;
  if (!KOKORO.loading) {
    KOKORO.loading = (async () => {
      $("voice-status").textContent = "voz: baixando Kokoro 82M (~90 MB, só na 1ª vez)…";
      const mod = await import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js");
      const device = navigator.gpu ? "webgpu" : "wasm";
      KOKORO.tts = await mod.KokoroTTS.from_pretrained(KOKORO.model, { dtype: "q8", device });
      return KOKORO.tts;
    })().catch(err => { KOKORO.loading = null; throw err; });
  }
  return KOKORO.loading;
}

function floatToWavBlob(f32, sampleRate = 24000) {
  const n = f32.length, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) { const s = Math.max(-1, Math.min(1, f32[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
  return new Blob([buf], { type: "audio/wav" });
}

async function kokoroSpeak(text) {
  const tts = await loadKokoro();
  $("voice-status").textContent = "voz: Kokoro 82M (open-source) — gerando…";
  const audio = await tts.generate(text.slice(0, 600), { voice: localStorage.getItem("adner_voice") || "pf_dora", speed: 1.0 });
  const blob = floatToWavBlob(audio.audio, audio.sampling_rate || 24000);
  new Audio(URL.createObjectURL(blob)).play();
  $("voice-status").textContent = "voz: Kokoro 82M (open-source) ✅";
}

async function speak(text) {
  if (!$("auto-speak").checked) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  if ($("voice-engine").value === "kokoro") {
    try { await kokoroSpeak(clean); return; }
    catch (err) {
      console.warn("Kokoro falhou, usando voz do navegador:", err);
      $("voice-status").textContent = "voz: navegador (Kokoro indisponível)";
    }
  } else $("voice-status").textContent = "voz: navegador";
  browserSpeak(clean);
}

$("voice-engine").value = localStorage.getItem("adner_voice_engine") || "browser";
$("voice-select").value = localStorage.getItem("adner_voice") || "pf_dora";
$("voice-engine").addEventListener("change", () => localStorage.setItem("adner_voice_engine", $("voice-engine").value));
$("voice-select").addEventListener("change", () => localStorage.setItem("adner_voice", $("voice-select").value));

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
if (SR) {
  rec = new SR();
  rec.lang = "pt-BR";
  rec.interimResults = false;
  rec.onresult = (e) => { $("chat-input").value = e.results[0][0].transcript; $("chat-form").dispatchEvent(new Event("submit", { cancelable: true })); };
  rec.onend = rec.onerror = () => $("mic-btn").classList.remove("listening");
}
$("mic-btn").addEventListener("click", () => {
  if (!rec) { alert("Ditado não suportado neste navegador. Use Chrome/Edge ou digite."); return; }
  if ($("mic-btn").classList.contains("listening")) { rec.stop(); return; }
  $("mic-btn").classList.add("listening");
  rec.start();
});

const history = () => store.get("adner_messages", []).slice(-12);

$("chat-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = $("chat-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg(text, "user");
  const msgs = history();
  msgs.push({ role: "user", content: text });

  const thinking = addMsg("digitando…", "bot");
  let reply;
  if (!providerReady()) {
    reply = offlineAgent(text);
  } else {
    try { reply = (await agentLoop(msgs)) || "…"; }
    catch (err) { reply = `⚠️ Erro ao falar com a IA: ${err.message}`; }
  }
  msgs.push({ role: "assistant", content: reply });
  store.set("adner_messages", msgs.slice(-40));

  thinking.textContent = reply;
  thinking.innerHTML = thinking.innerHTML.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  const p = activeProvider();
  $("provider").textContent = providerReady() ? `IA: ${p.model} (${p.name})` : `IA: offline — configure ⚙️`;
  speak(reply);
  refreshSide();
  messagesEl.scrollTop = messagesEl.scrollHeight;
  if (!providerReady() && /chave/i.test(reply)) $("api-key").focus();
});

$("event-form").addEventListener("submit", (e) => {
  e.preventDefault();
  addEvent({
    title: $("ev-title").value,
    event_date: $("ev-date").value,
    event_time: $("ev-time").value || null,
    repeat: $("ev-repeat").checked ? "weekly" : "none",
  });
  $("ev-title").value = "";
});

$("save-settings").addEventListener("click", () => {
  localStorage.setItem("adner_provider", $("provider-select").value);
  store.set("adner_key", $("api-key").value.trim());
  localStorage.setItem("adner_model", $("model-input").value.trim() || "");
  updateProviderUI();
  $("provider").textContent = providerReady() ? "IA: pronta ✅" : "IA: falta a chave";
});

$("provider-select").addEventListener("change", () => {
  const p = $("provider-select").value;
  $("api-key").style.display = p === "groq" ? "" : "none";
  $("model-input").placeholder = DEFAULTS[p].model;
});

$("clear-data").addEventListener("click", () => {
  if (confirm("Apagar TODOS os compromissos, memórias e conversas deste navegador?")) {
    ["adner_events", "adner_memories", "adner_messages"].forEach(k => localStorage.removeItem(k));
    refreshSide();
  }
});

function updateProviderUI() {
  const p = activeProvider();
  $("provider-select").value = p.name;
  $("api-key").style.display = p.name === "groq" ? "" : "none";
  $("model-input").value = localStorage.getItem("adner_model") || "";
  $("model-input").placeholder = DEFAULTS[p.name].model;
  $("provider").textContent = providerReady() ? `IA: ${p.model} (${p.name})` : "IA: configure ⚙️";
}

async function refreshSide() {
  const evs = futureEvents();
  const ul = $("events");
  if (evs.length) {
    ul.innerHTML = "";
    evs.forEach(ev => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${ev.title}<br><small style="color:var(--muted)">${ev.event_date}${ev.event_time ? " " + ev.event_time : ""}${ev.repeat === "weekly" ? " · semanal" : ""}</small></span><span class="del" title="remover">✕</span>`;
      li.querySelector(".del").onclick = () => { deleteEvent(ev.id); };
      ul.appendChild(li);
    });
  } else ul.innerHTML = "<li style='color:var(--muted)'>Nenhum compromisso</li>";

  const r = analyzeRoutine();
  let rt = "";
  if (!r.total_events) rt = "Anote compromissos para eu aprender sua rotina.";
  else {
    if (r.busiest_weekday) rt += `Dia mais movimentado: ${r.busiest_weekday}\n`;
    if (r.peak_hour) rt += `Horário de pico: ${r.peak_hour}\n`;
    if (r.recurring.length) rt += `Recorrentes: ${r.recurring.join(", ")}`;
  }
  $("routine").textContent = rt || "—";

  const mems = getMemories();
  $("memories").textContent = mems.length ? mems.map(m => `${m.content} (${m.count}x)`).join("\n") : "Ainda não aprendi nada sobre você.";
}

updateProviderUI();
refreshSide();
