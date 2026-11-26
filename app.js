const $ = (id) => document.getElementById(id);
const messagesEl = $("messages");

/* ===== Diagnóstico visível: qualquer erro aparece na tela, não só no console ===== */

function showError(msg) {
  let b = document.querySelector(".err-banner");
  if (!b) {
    b = document.createElement("div");
    b.className = "err-banner";
    document.body.appendChild(b);
  }
  b.textContent = `⚠️ ${msg}`;
  console.error(msg);
}
window.addEventListener("error", (e) => showError(e.message || "erro desconhecido"));
window.addEventListener("unhandledrejection", (e) => showError("(assíncrono) " + (e.reason?.message || e.reason)));

/* ===== App instalável (PWA): roda no celular como aplicativo ===== */

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

let installEvent = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e;
  $("install-btn").hidden = false;
});
$("install-btn").addEventListener("click", async () => {
  if (installEvent) {
    installEvent.prompt();
    installEvent = null;
    $("install-btn").hidden = true;
    return;
  }
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    alert("No iPhone/iPad: toque no botão Compartilhar (□↑) na barra do navegador e escolha 'Adicionar à Tela de Início'.");
  } else {
    alert("No Android: abra o menu do navegador (⋮) e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.");
  }
});

/* ===== Puter carregado de forma assíncrona — nunca trava a página ===== */

let puterLoading = null;
function ensurePuter() {
  if (typeof puter !== "undefined") return Promise.resolve(true);
  if (!puterLoading) {
    puterLoading = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://js.puter.com/v2/";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      setTimeout(() => resolve(typeof puter !== "undefined"), 10000);
      document.head.appendChild(s);
    }).catch(() => false);
  }
  return puterLoading;
}
let puterFailed = false;
ensurePuter().then((ok) => {
  puterFailed = !ok;
  if (typeof updateProviderUI === "function") updateProviderUI();
});

/* ================= Armazenamento local (funciona no GitHub Pages) ================= */

/* ---------- Supabase: sincronização opcional em nuvem ---------- */

const SUPA = { client: null, userId: null };

async function getSupa() {
  if (SUPA.client) return SUPA.client;
  const url = localStorage.getItem("adner_supa_url");
  const key = store.get("adner_supa_key", "");
  if (!url || !key) return null;
  const mod = await import("https://esm.sh/@supabase/supabase-js@2");
  SUPA.client = mod.createClient(url, key);
  const { data } = await SUPA.client.auth.getSession();
  SUPA.userId = data?.session?.user?.id || null;
  return SUPA.client;
}

async function supaLogged() {
  const c = await getSupa();
  if (!c || !SUPA.userId) return null;
  return c;
}

async function supaUpsert(table, rows) {
  const c = await supaLogged();
  if (!c || !rows.length) return;
  try {
    await c.from(table).upsert(rows.map(r => ({ ...r, user_id: SUPA.userId })), { onConflict: "user_id,id" });
  } catch (e) { console.warn("sync falhou:", e); }
}

async function supaUpsertKeyed(table, rows, conflict) {
  const c = await supaLogged();
  if (!c || !rows.length) return;
  try {
    await c.from(table).upsert(rows.map(r => ({ ...r, user_id: SUPA.userId })), { onConflict: conflict });
  } catch (e) { console.warn("sync falhou:", e); }
}

async function supaDelete(table, match) {
  const c = await supaLogged();
  if (!c) return;
  try { await c.from(table).delete().match({ ...match, user_id: SUPA.userId }); }
  catch (e) { console.warn("delete remoto falhou:", e); }
}

async function supaPullMerge() {
  const c = await supaLogged();
  if (!c) return false;
  try {
    const uid = SUPA.userId;
    const { data: evs } = await c.from("app_events").select("*").eq("user_id", uid);
    if (evs) {
      const map = new Map(getEvents().map(e => [e.id, e]));
      for (const e of evs) map.set(e.id, { id: e.id, title: e.title, event_date: e.event_date, event_time: e.event_time, repeat: e.repeat });
      store.set("adner_events", [...map.values()]);
    }
    const { data: mems } = await c.from("app_memories").select("*").eq("user_id", uid);
    if (mems) {
      const map = new Map(getMemories().map(m => [m.content.toLowerCase(), m]));
      for (const m of mems) {
        const k = m.content.toLowerCase();
        const ex = map.get(k);
        if (!ex || (m.count || 1) > ex.count) map.set(k, { content: m.content, count: m.count || 1, updated_at: m.updated_at });
      }
      store.set("adner_memories", [...map.values()]);
    }
    const { data: msgs } = await c.from("app_messages").select("role,content").eq("user_id", uid).order("id", { ascending: false }).limit(40);
    if (msgs && msgs.length) store.set("adner_messages", msgs.reverse().map(m => ({ role: m.role, content: m.content })));
    refreshSide();
    return true;
  } catch (e) {
    console.warn("pull falhou:", e);
    return false;
  }
}

async function initSupa() {
  const status = $("supa-status");
  if (!localStorage.getItem("adner_supa_url")) return;
  status.textContent = "conectando…";
  const c = await getSupa();
  if (!c) { status.textContent = "não conectado (verifique URL/anon key)"; return; }
  if (SUPA.userId) {
    const ok = await supaPullMerge();
    status.textContent = ok ? "☁️ sincronizado" : "☁️ conectado (falha ao sincronizar — rode o SQL do README no projeto)";
  } else status.textContent = "projeto conectado — entre com seu e-mail";
}

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
};

const getEvents = () => store.get("adner_events", []);
const getMemories = () => store.get("adner_memories", []);

function addEvent({ title, event_date, event_time = null, repeat = "none" }) {
  if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return { error: "title e event_date (AAAA-MM-DD) são obrigatórios" };
  const ev = { id: Date.now(), title, event_date, event_time, repeat: repeat === "weekly" ? "weekly" : "none", created_at: new Date().toISOString() };
  store.set("adner_events", [...getEvents(), ev]);
  supaUpsert("app_events", [ev]);
  refreshSide();
  return { ok: true, event: ev };
}

function deleteEvent(id) {
  const remaining = getEvents().filter(e => e.id !== Number(id));
  const deleted = remaining.length !== getEvents().length;
  store.set("adner_events", remaining);
  if (deleted) supaDelete("app_events", { id: Number(id) });
  refreshSide();
  return { ok: deleted };
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
  const target = fact.trim();
  const found = memories.find(m => m.content.toLowerCase() === target.toLowerCase());
  let saved;
  if (found) { found.count += 1; found.updated_at = new Date().toISOString(); saved = found; }
  else { saved = { content: target, count: 1, updated_at: new Date().toISOString() }; memories.push(saved); }
  store.set("adner_memories", memories);
  supaUpsertKeyed("app_memories", [{ ...saved }], "user_id,content");
  refreshSide();
  return { ok: true };
}

function forgetFact(fact) {
  const target = String(fact).toLowerCase();
  const memories = getMemories().filter(m => m.content.toLowerCase() !== target);
  store.set("adner_memories", memories);
  supaDelete("app_memories", { content: fact });
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

function buildSystemPrompt(nativeTools = true) {
  const weekdays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const rot = analyzeRoutine();
  const mem = getMemories().slice(0, 10).map(m => `- (${m.count}x) ${m.content}`).join("\n") || "Nada ainda.";
  const evs = futureEvents().slice(0, 10).map(e => `- ${e.event_date}${e.event_time ? " " + e.event_time : ""}${e.repeat === "weekly" ? " (semanal)" : ""}: ${e.title}`).join("\n") || "Nenhum.";
  let prompt =
    `Você é o Adner, um assistente pessoal em português, pró-ativo e objetivo. ` +
    `Hoje é ${weekdays[now.getDay()]}, ${today}\n\n` +
    `== O que você sabe sobre a pessoa ==\n${mem}\n\n` +
    `== Próximos compromissos ==\n${evs}\n\n` +
    `== Rotina detectada ==\n${JSON.stringify({ busiest_weekday: rot.busiest_weekday, peak_hour: rot.peak_hour, recurring: rot.recurring })}\n\n` +
    `REGRAS:\n` +
    `- Sempre que o usuário pedir para marcar/anotar/agendar algo, faça a ação e confirme.\n` +
    `- Quando o usuário contar algo pessoal (nome, trabalho, gostos), memorize.\n` +
    `- Responda em no máximo 4 frases, a menos que peçam detalhes. `;
  if (!nativeTools) {
    prompt +=
      `\n\nPROTOCOLO DE AÇÕES (obrigatório):\n` +
      `Quando precisar agir, responda SOMENTE uma linha JSON válida, sem texto ao redor:\n` +
      `{"action":"add_event","args":{"title":"...","event_date":"AAAA-MM-DD","event_time":"HH:MM ou null","repeat":"none|weekly"}}\n` +
      `{"action":"delete_event","args":{"id":NUMERO}}\n` +
      `{"action":"remember_fact","args":{"fact":"..."}}\n` +
      `{"action":"forget_fact","args":{"fact":"..."}}\n` +
      `{"action":"list_events","args":{}}\n` +
      `{"action":"analyze_routine","args":{}}\n` +
      `Depois que eu enviar uma mensagem iniciando com TOOL_RESULT, responda ao usuário normalmente.\n` +
      `Se não precisar agir, apenas responda em texto normal (sem JSON).`;
  }
  return prompt;
}

/* ================= Provedores de IA ================= */

const DEFAULTS = {
  puter: { model: "gpt-5-nano" },
  groq: { model: "llama-3.3-70b-versatile", base: "https://api.groq.com/openai/v1" },
  ollama: { model: "llama3.2", base: "http://localhost:11434/v1" },
};

function activeProvider() {
  const p = localStorage.getItem("adner_provider") || "puter";
  const key = store.get("adner_key", "");
  const model = localStorage.getItem("adner_model") || DEFAULTS[p].model;
  return { name: p, base: DEFAULTS[p].base, key, model };
}

function providerReady() {
  const p = activeProvider();
  if (p.name === "puter") {
    if (puterFailed && typeof puter === "undefined") return false;
    return typeof puter !== "undefined" || puterLoading !== null;
  }
  if (p.name === "ollama") return true;
  return !!p.key;
}

const IA_TIMEOUT = 45000;

async function chatCompletion(messages) {
  const p = activeProvider();
  const headers = { "Content-Type": "application/json" };
  if (p.key) headers.Authorization = `Bearer ${p.key}`;
  const res = await fetch(`${p.base}/chat/completions`, {
    method: "POST", headers,
    signal: AbortSignal.timeout(IA_TIMEOUT),
    body: JSON.stringify({ model: p.model, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.6 }),
  });
  if (!res.ok) throw new Error(`IA respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).choices[0].message;
}

async function puterChat(messages) {
  await ensurePuter();
  if (typeof puter === "undefined") throw new Error("Puter não está acessível (CDN bloqueado na sua rede?) — use a chave grátis da Groq nas configurações ⚙️");
  if (!puter.auth.isSignedIn()) {
    try {
      await puter.auth.signIn();
    } catch {
      throw new Error("Janela de login gratuito do Puter cancelada ou bloqueada. Permita popups neste site e envie a mensagem de novo (é 1x só). Ou use uma chave grátis da Groq nas configurações ⚙️.");
    }
  }
  const p = activeProvider();
  const resp = await Promise.race([
    puter.ai.chat(messages, { model: p.model, temperature: 0.6 }),
    new Promise((_, rej) => setTimeout(() => rej(new Error("IA demorou demais (>45s) — tente enviar de novo")), IA_TIMEOUT)),
  ]);
  let content = resp?.message?.content ?? resp;
  if (Array.isArray(content)) content = content.map(c => (c && c.text) || String(c)).join("");
  return typeof content === "string" ? content : JSON.stringify(content);
}

function parseAction(reply) {
  const m = reply.match(/```json\s*([\s\S]+?)```/) || reply.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1] ?? m[0]);
    if (obj && typeof obj.action === "string") return obj;
  } catch { /* resposta normal de conversa */ }
  return null;
}

function runToolSafe(name, args) {
  try { return runTool(name, args || {}); }
  catch (e) { return { error: String(e) }; }
}

async function agentLoop(conversationHistory) {
  const p = activeProvider();
  const nativeTools = p.name !== "puter";
  const messages = [{ role: "system", content: buildSystemPrompt(nativeTools) }, ...conversationHistory];
  for (let i = 0; i < 4; i++) {
    if (!nativeTools) {
      const content = await puterChat(messages);
      const act = parseAction(content);
      if (!act) return content;
      messages.push({ role: "assistant", content });
      const result = runToolSafe(act.action, act.args);
      messages.push({ role: "user", content: `TOOL_RESULT (do sistema, não do usuário): ${JSON.stringify(result)}` });
      continue;
    }
    const msg = await chatCompletion(messages);
    messages.push(msg);
    if (!msg.tool_calls) return msg.content;
    for (const call of msg.tool_calls) {
      const result = runToolSafe(call.function.name, JSON.parse(call.function.arguments || "{}"));
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

function cleanForSpeech(text) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}•]/gu, "").replace(/\s+/g, " ").trim();
}

let lastSpoken = { audioURL: null, text: "" };
function showReplay() { $("replay-btn").hidden = false; }

$("replay-btn").addEventListener("click", () => {
  $("replay-btn").hidden = true;
  if (lastSpoken.audioURL) { playAudio(lastSpoken.audioURL); return; }
  if (lastSpoken.text) browserSpeak(lastSpoken.text);
});

function playAudio(url) {
  const a = new Audio(url);
  const p = a.play();
  if (p) p.catch(() => { lastSpoken.audioURL = url; showReplay(); });
}

const MALE_HINT = /mascul|male|daniel|thiago|ant[oô]nio|ricardo|felipe|pedro|gabriel|andr[eé]|rafael/i;

function systemPtVoices() {
  if (!("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices().filter(v => /^pt/i.test(v.lang.toLowerCase().replace("_", "-")) || v.lang.toLowerCase().startsWith("pt"));
}

function pickMaleSystemVoice() {
  const pt = systemPtVoices();
  return pt.find(v => MALE_HINT.test(v.name)) || null;
}

function refreshSystemVoices() {
  const group = document.getElementById("voice-sys-group");
  if (!group) return;
  group.innerHTML = "";
  for (const v of systemPtVoices()) {
    const o = document.createElement("option");
    o.value = "nv:" + v.name;
    o.textContent = `${v.name} (${v.lang})${MALE_HINT.test(v.name) ? " 👨" : ""}`;
    group.appendChild(o);
  }
  const sel = $("voice-select");
  const saved = localStorage.getItem("adner_voice") || "auto";
  sel.value = [...sel.options].some(o => o.value === saved) ? saved : "auto";
}
if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = refreshSystemVoices;
  refreshSystemVoices();
}

function browserSpeak(text, voiceObj = null) {
  if (!("speechSynthesis" in window)) {
    $("voice-status").textContent = "voz: não suportada neste navegador — clique em ▶️";
    showReplay();
    return;
  }
  speechSynthesis.cancel();
  speechSynthesis.resume();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 1.02;
  const voice = voiceObj || systemPtVoices()[0];
  if (voice) u.voice = voice;
  u.onerror = () => { $("voice-status").textContent = "voz: falhou — clique em ▶️ Tocar resposta"; showReplay(); };
  speechSynthesis.speak(u);
}

/* ---------- Kokoro 82M: TTS open-source (Apache-2.0) rodando no navegador ---------- */

const KOKORO = { model: "onnx-community/Kokoro-82M-v1.0-ONNX", tts: null, loading: null };

async function loadKokoro() {
  if (KOKORO.tts) return KOKORO.tts;
  if (!KOKORO.loading) {
    KOKORO.loading = (async () => {
      const t0 = Date.now();
      $("voice-status").textContent = "voz: baixando Alex (masculina, open source, ~90 MB — só esta 1ª vez; no Wi-Fi é rápido)…";
      const iv = setInterval(() => {
        const s = Math.round((Date.now() - t0) / 1000);
        if (s > 2) $("voice-status").textContent = `voz: baixando Alex (masculina)… ${s}s — só esta 1ª vez (~90 MB)`;
      }, 1000);
      try {
        const mod = await import("https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js");
        const device = navigator.gpu ? "webgpu" : "wasm";
        KOKORO.tts = await mod.KokoroTTS.from_pretrained(KOKORO.model, { dtype: "q8", device });
        $("voice-status").textContent = "voz: Alex (masculina, open source) ✅";
        return KOKORO.tts;
      } finally {
        clearInterval(iv);
      }
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

function voiceSpeed() {
  return parseFloat($("voice-speed").value || "0.95");
}

/* ---------- Piper/VITS: segundo motor de voz masculina open source (Faber, pt-BR, MIT) ---------- */

const VITS = { lib: null };

async function vitsSpeak(text) {
  const id = "pt_BR-faber-medium";
  if (!VITS.lib) {
    VITS.lib = await import("https://cdn.jsdelivr.net/npm/@diffusionstudio/vits-web@1.0.3/dist/vits-web.js");
  }
  const lib = VITS.lib;
  const stored = await lib.stored().catch(() => []);
  if (!stored.includes(id)) {
    $("voice-status").textContent = "voz: baixando Faber (masculina, ~63 MB, só uma vez)…";
    await lib.download(id, () => {});
  }
  $("voice-status").textContent = "voz: Faber (masculina, open source) — gerando…";
  const wav = await lib.predict({ text: text.slice(0, 500), voiceId: id });
  const url = URL.createObjectURL(wav);
  lastSpoken.audioURL = url;
  playAudio(url);
  $("voice-status").textContent = "voz: Faber (masculina, open source) ✅";
}

async function kokoroSpeak(text, voiceId) {
  const tts = await loadKokoro();
  $("voice-status").textContent = "voz: Kokoro 82M (open-source) — gerando…";
  const audio = await tts.generate(text.slice(0, 600), { voice: voiceId, speed: voiceSpeed() });
  const url = URL.createObjectURL(floatToWavBlob(audio.audio, audio.sampling_rate || 24000));
  lastSpoken.audioURL = url;
  playAudio(url);
  $("voice-status").textContent = `voz: Kokoro ${voiceId} (open-source) ሴ`;
}

async function speak(text) {
  if (!$("auto-speak").checked) return;
  const clean = cleanForSpeech(text);
  if (!clean) return;
  lastSpoken = { audioURL: null, text: clean };
  const choice = localStorage.getItem("adner_voice") || "auto";

  if (choice.startsWith("kokoro:")) {
    try { await kokoroSpeak(clean, choice.slice(7)); return; }
    catch (err) {
      console.warn("Kokoro indisponível:", err);
      $("voice-status").textContent = KOKORO.tts ? "voz: navegador (Kokoro falhou)" : "voz: navegador (Kokoro ainda não carregou — tente de novo)";
      return browserSpeak(clean);
    }
  }

  if (choice.startsWith("nv:")) {
    const v = speechSynthesis.getVoices().find(x => x.name === choice.slice(3));
    $("voice-status").textContent = `voz: ${v ? v.name : "navegador"}`;
    return browserSpeak(clean, v || null);
  }

  const male = pickMaleSystemVoice();
  if (male) {
    $("voice-status").textContent = `voz: ${male.name} (masculina, do seu sistema)`;
    return browserSpeak(clean, male);
  }
  try {
    await kokoroSpeak(clean, "pm_alex");
    return;
  } catch (err) {
    console.warn("Kokoro indisponível:", err);
  }
  try {
    await vitsSpeak(clean);
    return;
  } catch (err) {
    console.warn("Piper indisponível:", err);
    showError("Voz masculina falhou (Alex e Faber): " + (err?.message || err) + " — confira a internet/Wi-Fi");
    $("voice-status").textContent = "voz masculina falhou — usando voz temporária do navegador";
  }
  browserSpeak(clean);
}

$("voice-select").value = localStorage.getItem("adner_voice") || "auto";
$("voice-speed").value = localStorage.getItem("adner_speed") || "0.95";
$("speed-label").textContent = (+$("voice-speed").value).toFixed(2).replace(/0$/, "");
{
  const v = localStorage.getItem("adner_voice") || "auto";
  if (v === "auto" || v.startsWith("kokoro:")) loadKokoro().catch(() => {});
}
$("voice-select").addEventListener("change", () => {
  localStorage.setItem("adner_voice", $("voice-select").value);
  speak("Olá! Esta é minha voz agora.");
});
$("voice-speed").addEventListener("input", () => {
  $("speed-label").textContent = (+$("voice-speed").value).toFixed(2).replace(/0$/, "");
  localStorage.setItem("adner_speed", $("voice-speed").value);
});
$("test-voice").addEventListener("click", async () => {
  if (!$("auto-speak").checked) { $("auto-speak").checked = true; }
  const btn = $("test-voice");
  btn.disabled = true;
  await speak("Olá! Eu sou o Adner, seu assistente pessoal. Estou falando com você.");
  btn.disabled = false;
});

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
  try {
    const input = $("chat-input");
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addMsg(text, "user");
    const msgs = history();
    msgs.push({ role: "user", content: text });

    const thinking = addMsg("digitando…", "bot");
    const slowHint = setTimeout(() => {
      thinking.textContent = "ainda processando… se abriu a janela de login gratuito do Puter, entre nela (ou permita popups). Na 2ª mensagem vai direto.";
    }, 6000);
    let reply;
    if (!providerReady()) {
      reply = offlineAgent(text);
    } else {
      try { reply = (await agentLoop(msgs)) || "…"; }
      catch (err) { reply = `⚠️ Erro ao falar com a IA: ${err.message}`; }
    }
    clearTimeout(slowHint);
    msgs.push({ role: "assistant", content: reply });
    store.set("adner_messages", msgs.slice(-40));
    supaUpsert("app_messages", [
      { id: Date.now() - 1, role: "user", content: text },
      { id: Date.now(), role: "assistant", content: reply },
    ]);

    thinking.textContent = reply;
    thinking.innerHTML = thinking.innerHTML.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    const p = activeProvider();
    $("provider").textContent = providerReady() ? `IA: ${p.model} (${p.name})` : `IA: offline — configure ⚙️`;
    speak(reply);
    refreshSide();
    messagesEl.scrollTop = messagesEl.scrollHeight;
    if (!providerReady() && /chave/i.test(reply)) $("api-key").focus();
  } catch (err) {
    showError("falha no envio: " + err.message);
    const t = addMsg(`⚠️ Não consegui enviar: ${err.message}`, "bot");
    void t;
  }
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
  addMsg("✅ Configuração salva. Pode conversar!", "bot");
});

$("provider-select").addEventListener("change", () => {
  const p = $("provider-select").value;
  $("api-key").style.display = p === "groq" ? "" : "none";
  $("model-input").placeholder = DEFAULTS[p].model;
  $("provider-hint").style.display = p === "groq" ? "" : "none";
});

$("clear-data").addEventListener("click", () => {
  if (confirm("Apagar TODOS os compromissos, memórias e conversas deste navegador?")) {
    ["adner_events", "adner_memories", "adner_messages"].forEach(k => localStorage.removeItem(k));
    refreshSide();
  }
});

function updateProviderUI() {
  const p = activeProvider();
  if (p.name === "puter" && puterFailed && typeof puter === "undefined") {
    $("provider").textContent = "IA: Puter inacessível — use chave Groq ⚙️ ou Ollama";
  } else $("provider").textContent = providerReady() ? `IA: ${p.model} (${p.name})` : "IA: configure ⚙️";
  $("provider-select").value = p.name;
  $("api-key").style.display = p.name === "groq" ? "" : "none";
  $("provider-hint").style.display = p.name === "groq" ? "" : "none";
  $("model-input").value = localStorage.getItem("adner_model") || "";
  $("model-input").placeholder = DEFAULTS[p.name].model;
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

$("supa-connect").addEventListener("click", () => {
  const url = $("supa-url").value.trim().replace(/\/$/, "");
  const key = $("supa-key").value.trim();
  if (!/^https:\/\/.+supabase\.(co|in)/.test(url) || !key) {
    $("supa-status").textContent = "informe a URL do projeto e a anon key";
    return;
  }
  localStorage.setItem("adner_supa_url", url);
  store.set("adner_supa_key", key);
  SUPA.client = null; SUPA.userId = null;
  initSupa();
});

$("supa-signin").addEventListener("click", async () => {
  const c = await getSupa();
  if (!c) { $("supa-status").textContent = "conecte o projeto primeiro (passo 1)"; return; }
  const { error } = await c.auth.signInWithPassword({ email: $("supa-email").value.trim(), password: $("supa-pass").value });
  if (error) { $("supa-status").textContent = "erro no login: " + error.message; return; }
  SUPA.userId = (await c.auth.getUser()).data?.user?.id;
  const ok = await supaPullMerge();
  $("supa-status").textContent = ok ? "☁️ sincronizado" : "☁️ logado (rode o SQL do README no seu projeto)";
});

$("supa-signup").addEventListener("click", async () => {
  const c = await getSupa();
  if (!c) { $("supa-status").textContent = "conecte o projeto primeiro (passo 1)"; return; }
  const { error } = await c.auth.signUp({ email: $("supa-email").value.trim(), password: $("supa-pass").value });
  $("supa-status").textContent = error ? "erro: " + error.message : "conta criada! Confirme o e-mail (se pedido) e faça o 2. Entrar";
});

$("supa-signout").addEventListener("click", async () => {
  const c = await getSupa();
  if (c) await c.auth.signOut();
  SUPA.userId = null;
  $("supa-status").textContent = "desconectado (dados locais mantidos)";
});

initSupa();
updateProviderUI();
refreshSide();
