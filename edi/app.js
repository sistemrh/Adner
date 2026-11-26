const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const WAKE_WORD = "sil";

const SPEECHIFY_API_KEY = "sk_aws5h0bt4k98pf3kz5nfcd1w00w2hqsash8wtxrk5sw";
const SPEECHIFY_URL = "https://api.speechify.ai/v1/audio/stream";
const SPEECHIFY_VOICES_URL = "https://api.speechify.ai/v1/voices";
const SPEECHIFY_MODELS = ["simba-multilingual", "simba-3.2", "simba-3.0", "simba-english"];
const SPEECHIFY_VOICE_NAME = "caio";
const SPEECHIFY_FALLBACK_VOICE = "geffen_32";
const MAX_CHUNK = 900;

const WMO_CODES = {
  0: "céu limpo", 1: "predominantemente limpo", 2: "parcialmente nublado", 3: "nublado",
  45: "neblina", 48: "neblina com geada",
  51: "garoa leve", 53: "garoa moderada", 55: "garoa intensa",
  56: "garoa congelante leve", 57: "garoa congelante intensa",
  61: "chuva leve", 63: "chuva moderada", 65: "chuva forte",
  66: "chuva congelante leve", 67: "chuva congelante forte",
  71: "neve leve", 73: "neve moderada", 75: "neve forte", 77: "grãos de neve",
  80: "pancadas de chuva leves", 81: "pancadas de chuva moderadas", 82: "pancadas de chuva fortes",
  85: "pancadas de neve leves", 86: "pancadas de neve fortes",
  95: "tempestade", 96: "tempestade com granizo leve", 99: "tempestade com granizo forte"
};

const SYSTEM_PROMPT = [
  "Você é Sil, uma voz com personalidade inspirada no Jarvis dos filmes do Homem de Ferro.",
  "Você é extremamente competente, leal, elegante e tem um humor sutil e britânico.",
  "Responda sempre em português do Brasil, de forma curta e natural para ser falada em voz alta.",
  "Nunca se apresente, nunca diga que é uma assistente, assistente de voz ou IA, e não fale de si mesma desnecessariamente.",
  "Vá direto ao ponto, como um mordomo experiente que já conhece o patrão há anos.",
  "Trate o usuário pelo nome Claudio.",
  "Evite listas, markdown e emojis: suas respostas serão lidas em voz alta por um sintetizador.",
  "Você tem uma memória de longo prazo sobre Claudio, listada neste prompt. Use-a naturalmente, sem anunciar que está consultando memória.",
  "Quando Claudio pedir para anotar, tomar nota, guardar ou lembrar de algo, use a ferramenta remember e confirme em uma frase curta.",
  "Quando Claudio pedir para esquecer ou apagar algo, use a ferramenta forget e confirme.",
  "Para perguntas sobre o tempo, use a ferramenta get_weather. Se não souberem a cidade, pergunte apenas qual cidade.",
  "Você sabe a data e a hora atuais porque elas são informadas neste prompt. Use-as sem hesitar."
].join(" ");

const SUPABASE_URL = "https://sqbzrwjctudhktfgdnkn.supabase.co";
const SUPABASE_KEY = "sb_publishable_TOLM_QG6OEuogwUG5D6PKw_8dm-SJ6s";
const MEMORY_TABLE = "memories";
const MEMORY_KEY = "sil-memories";

let memories = [];
try { memories = JSON.parse(localStorage.getItem(MEMORY_KEY)) || []; } catch (e) { memories = []; }
let memoryOnline = false;

function saveMemories() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const error = new Error("Supabase " + response.status);
    error.status = response.status;
    throw error;
  }
  return response;
}

async function loadMemories() {
  try {
    const response = await supabaseRequest(`${MEMORY_TABLE}?select=text,em&order=em.asc`);
    const rows = await response.json();
    const remote = rows.map(r => ({ text: r.text, em: r.em }));
    memoryOnline = true;
    const known = new Set(remote.map(m => m.text.toLowerCase()));
    const localOnly = memories.filter(m => !known.has(m.text.toLowerCase()));
    memories = remote;
    for (const item of localOnly) {
      try {
        await supabaseRequest(MEMORY_TABLE, {
          method: "POST",
          body: JSON.stringify(item),
          headers: { "Prefer": "return=minimal" }
        });
        memories.push(item);
      } catch (e) { /* keeps item local only */ }
    }
  } catch (e) {
    memoryOnline = false;
  }
  saveMemories();
}
loadMemories();

async function rememberFact(fato) {
  const item = { text: fato, em: new Date().toISOString() };
  memories.push(item);
  saveMemories();
  if (memoryOnline) {
    try {
      await supabaseRequest(MEMORY_TABLE, {
        method: "POST",
        body: JSON.stringify(item),
        headers: { "Prefer": "return=minimal" }
      });
    } catch (e) { /* kept in local cache */ }
  }
}

async function forgetFacts(terms) {
  const before = memories.length;
  memories = memories.filter(m => {
    const hay = m.text.toLowerCase();
    return !terms.some(t => hay.includes(t));
  });
  saveMemories();
  if (memoryOnline && terms.length) {
    const filter = terms.map(t => `text.ilike.*${encodeURIComponent(t)}*`).join(",");
    try {
      await supabaseRequest(`${MEMORY_TABLE}?or=(${filter})`, { method: "DELETE" });
    } catch (e) { /* cache already updated */ }
  }
  return before - memories.length;
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Obtém o tempo atual e a previsão para hoje e amanhã de uma cidade",
      parameters: {
        type: "object",
        properties: {
          cidade: { type: "string", description: "Nome da cidade, ex.: São Paulo" }
        },
        required: ["cidade"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "remember",
      description: "Guarda uma informação na memória de longo prazo sobre Claudio, sua família, rotinas, preferências ou compromissos",
      parameters: {
        type: "object",
        properties: {
          fato: { type: "string", description: "A informação a ser guardada, escrita de forma clara e completa" }
        },
        required: ["fato"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "forget",
      description: "Apaga da memória informações que correspondam à consulta",
      parameters: {
        type: "object",
        properties: {
          consulta: { type: "string", description: "Palavras-chave do que deve ser apagado" }
        },
        required: ["consulta"]
      }
    }
  }
];

const orb = document.getElementById("orb");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const continuousToggle = document.getElementById("continuous");
const stopSpeechBtn = document.getElementById("stop-speech");
const textForm = document.getElementById("text-form");
const textInput = document.getElementById("text-input");

const history = [
  { role: "system", content: SYSTEM_PROMPT }
];

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let wakeMode = false;
let manualStop = false;
let busy = false;
let audioPlayer = new Audio();
let speakSession = 0;
let speechifyVoiceId = localStorage.getItem("edi-speechify-voice") || "";
let speechifyModel = localStorage.getItem("edi-speechify-model") || "";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function discoverSpeechifyVoice() {
  const variants = [
    "?type=shared&locale=pt-BR&limit=200",
    "?type=shared&locale=pt&limit=200",
    "?type=shared&limit=200"
  ];
  for (const qs of variants) {
    try {
      const response = await fetch(SPEECHIFY_VOICES_URL + qs, {
        headers: { "Authorization": "Bearer " + SPEECHIFY_API_KEY }
      });
      if (!response.ok) continue;
      const data = await response.json();
      const items = Array.isArray(data) ? data : (data.voices || data.items || data.data || []);
      const wanted = items.find(v => (v.display_name || v.name || "").toLowerCase().includes(SPEECHIFY_VOICE_NAME))
        || items.find(v => (v.gender || (v.labels && v.labels.gender) || "").toString().toLowerCase().startsWith("m"));
      if (wanted && (wanted.id || wanted.voice_id)) {
        speechifyVoiceId = wanted.id || wanted.voice_id;
        localStorage.setItem("edi-speechify-voice", speechifyVoiceId);
        return;
      }
    } catch (e) { /* try next variant */ }
  }
  if (!speechifyVoiceId) speechifyVoiceId = SPEECHIFY_FALLBACK_VOICE;
}
discoverSpeechifyVoice();

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  recognition.onstart = () => setStatus("Ouvindo… fale agora", "listening");
  recognition.onresult = (event) => {
    let finalText = "";
    let interimText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interimText += transcript;
    }
    if (finalText.trim()) handleUtterance(finalText.trim());
    else if (interimText.trim()) setStatus(`“${interimText.trim()}”`, "listening");
  };
  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      setStatus("Permissão de microfone negada. Use o campo de texto.", "idle");
      continuousToggle.checked = false;
      wakeMode = false;
    } else if (event.error === "no-speech") {
      setStatus("Não ouvi nada. Tente novamente.", "idle");
    } else {
      setStatus("Erro no microfone: " + event.error, "idle");
    }
    if (!busy) orb.classList.remove("listening");
  };
  recognition.onend = () => {
    if (!busy) orb.classList.remove("listening");
    if (wakeMode && !busy) {
      try { recognition.start(); } catch (e) { /* already started */ }
    }
  };
} else {
  setStatus("Seu navegador não suporta voz. Use o campo de texto abaixo.", "idle");
}

orb.addEventListener("click", () => {
  if (!recognition) {
    textInput.focus();
    return;
  }
  if (orb.classList.contains("listening")) {
    manualStop = true;
    recognition.stop();
    setStatus("Escuta pausada. Toque de novo para falar.", "idle");
    return;
  }
  try {
    recognition.start();
  } catch (e) {
    setStatus("Aguarde um instante e toque novamente.", "idle");
  }
});

continuousToggle.addEventListener("change", () => {
  wakeMode = continuousToggle.checked;
  if (!recognition) {
    continuousToggle.checked = false;
    return;
  }
  if (wakeMode) {
    setStatus('Modo contínuo: diga "Sil" para me chamar.', "idle");
    try { recognition.start(); } catch (e) { /* already running */ }
  } else {
    manualStop = true;
    try { recognition.stop(); } catch (e) { /* already stopped */ }
    setStatus("Escuta contínua desligada.", "idle");
  }
});

stopSpeechBtn.addEventListener("click", stopSpeaking);

textForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text || busy) return;
  textInput.value = "";
  handleUtterance(text, false);
});

function stopSpeaking() {
  speakSession++;
  window.speechSynthesis.cancel();
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.src = "";
  }
  orb.classList.remove("speaking");
  if (!busy) setStatus("Ao seu dispor.", "idle");
}

async function handleUtterance(text, fromVoice = true) {
  if (busy) return;
  busy = true;
  manualStop = false;

  let command = text;
  if (fromVoice && wakeMode) {
    const lower = text.toLowerCase();
    const index = lower.indexOf(WAKE_WORD);
    if (index === -1) {
      busy = false;
      return;
    }
    command = text.slice(index + WAKE_WORD.length).replace(/^[\s,.!?]+/, "");
    if (!command) {
      await speak("Sim?");
      busy = false;
      return;
    }
  }

  addMessage("user", text);
  setStatus("Pensando…", "thinking");
  orb.classList.remove("listening");
  orb.classList.add("thinking");

  history.push({ role: "user", content: command });
  while (history.length > 21) history.splice(1, 2);

  try {
    const reply = await askGroq();
    history.push({ role: "assistant", content: reply });
    addMessage("edi", reply);
    await speak(reply);
  } catch (error) {
    history.pop();
    const message = error && error.message ? error.message : "Falha de conexão.";
    addMessage("error", message);
    setStatus("Encontrei um problema.", "idle");
    await speak("Desculpe, encontrei um problema.");
  } finally {
    busy = false;
    orb.classList.remove("thinking", "speaking");
    if (wakeMode) {
      setStatus('Aguardando "Sil"…', "idle");
      try { recognition.start(); } catch (e) { /* already running */ }
    } else {
      setStatus("Toque no núcleo para falar de novo.", "idle");
    }
  }
}

function injectDateTime() {
  const now = new Date();
  const formatted = now.toLocaleString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  });
  let context = SYSTEM_PROMPT + `\n\nData e hora atuais: ${formatted} (horário de Brasília).`;
  if (memories.length) {
    context += "\n\nMemórias de longo prazo sobre Claudio:\n" + memories.map(m => {
      const quando = m.em ? new Date(m.em).toLocaleDateString("pt-BR") : "";
      return `- ${quando ? "(" + quando + ") " : ""}${m.text}`;
    }).join("\n");
  } else {
    context += "\n\nA memória de longo prazo está vazia.";
  }
  history[0] = { role: "system", content: context };
}

async function askGroq() {
  for (let hop = 0; hop < 3; hop++) {
    injectDateTime();
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_API_KEY
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: history,
        tools: TOOLS,
        temperature: 0.6,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      let detail = response.status + " " + response.statusText;
      try {
        const data = await response.json();
        if (data.error && data.error.message) detail = data.error.message;
      } catch (e) { /* keep status text */ }
      throw new Error(detail);
    }

    const data = await response.json();
    const message = data.choices && data.choices[0] && data.choices[0].message;
    if (!message) return "Não consegui formular uma resposta.";

    if (message.tool_calls && message.tool_calls.length) {
      history.push(message);
      for (const call of message.tool_calls) {
        let result = "{}";
        try {
          const args = JSON.parse(call.function.arguments || "{}");
          if (call.function.name === "get_weather") {
            result = JSON.stringify(await getWeather(args.cidade || ""));
          } else if (call.function.name === "remember") {
            const fato = (args.fato || "").trim();
            if (fato) {
              await rememberFact(fato);
              result = JSON.stringify({ ok: true, total: memories.length });
            } else {
              result = JSON.stringify({ ok: false, erro: "Fato vazio." });
            }
          } else if (call.function.name === "forget") {
            const terms = (args.consulta || "").toLowerCase().split(/\s+/).filter(t => t.length > 2);
            const removidas = await forgetFacts(terms);
            result = JSON.stringify({ ok: true, removidas: removidas });
          }
        } catch (e) {
          result = JSON.stringify({ erro: "Não consegui executar a operação." });
        }
        history.push({ role: "tool", tool_call_id: call.id, content: result });
      }
      continue;
    }

    return message.content ? message.content.trim() : "Não consegui formular uma resposta.";
  }
  return "Não consegui concluir a consulta.";
}

async function getWeather(cidade) {
  if (!cidade) return { erro: "Cidade não informada." };
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cidade)}&count=1&language=pt&format=json`;
  const geoResponse = await fetch(geoUrl);
  if (!geoResponse.ok) return { erro: "Falha ao buscar a cidade." };
  const geoData = await geoResponse.json();
  const place = geoData.results && geoData.results[0];
  if (!place) return { erro: `Não encontrei a cidade ${cidade}.` };

  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    timezone: "auto",
    forecast_days: "2"
  });
  const weatherResponse = await fetch("https://api.open-meteo.com/v1/forecast?" + params);
  if (!weatherResponse.ok) return { erro: "Falha ao obter a previsão." };
  const weather = await weatherResponse.json();

  const dailyDates = weather.daily.time;
  return {
    local: `${place.name}${place.admin1 ? ", " + place.admin1 : ""}`,
    atual: {
      temperatura: Math.round(weather.current.temperature_2m),
      sensacao: Math.round(weather.current.apparent_temperature),
      umidade: weather.current.relative_humidity_2m,
      condicao: WMO_CODES[weather.current.weather_code] || "condição desconhecida",
      vento_kmh: Math.round(weather.current.wind_speed_10m)
    },
    hoje: {
      data: dailyDates[0],
      maxima: Math.round(weather.daily.temperature_2m_max[0]),
      minima: Math.round(weather.daily.temperature_2m_min[0]),
      chuva_mm: weather.daily.precipitation_sum[0],
      condicao: WMO_CODES[weather.daily.weather_code[0]] || "condição desconhecida"
    },
    amanha: {
      data: dailyDates[1],
      maxima: Math.round(weather.daily.temperature_2m_max[1]),
      minima: Math.round(weather.daily.temperature_2m_min[1]),
      chuva_mm: weather.daily.precipitation_sum[1],
      condicao: WMO_CODES[weather.daily.weather_code[1]] || "condição desconhecida"
    }
  };
}

function splitIntoChunks(text) {
  const clean = text.replace(/[*_`#>]/g, "").trim();
  if (clean.length <= MAX_CHUNK) return [clean];
  const sentences = clean.split(/(?<=[.!?…])\s+/);
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + " " + sentence).trim().length > MAX_CHUNK && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = (current + " " + sentence).trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function speak(text) {
  const session = ++speakSession;
  const chunks = splitIntoChunks(text);
  orb.classList.remove("thinking");
  orb.classList.add("speaking");
  setStatus("Falando…", "speaking");

  for (const chunk of chunks) {
    if (session !== speakSession) return;
    const ok = await speakWithSpeechify(chunk, session);
    if (!ok && session === speakSession) {
      await speakWithBrowser(chunk, session, true);
    }
    if (session !== speakSession) return;
  }

  if (session === speakSession) {
    orb.classList.remove("speaking");
    setStatus("Ao seu dispor.", "idle");
  }
}

async function speakWithSpeechify(text, session) {
  if (!speechifyVoiceId) await discoverSpeechifyVoice();
  const models = [speechifyModel, ...SPEECHIFY_MODELS].filter((m, i, arr) => m && arr.indexOf(m) === i);
  try {
    for (const model of models) {
      const response = await fetch(SPEECHIFY_URL, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + SPEECHIFY_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        body: JSON.stringify({
          input: text,
          voice_id: speechifyVoiceId,
          model: model
        })
      });
      if (!response.ok) continue;
      speechifyModel = model;
      localStorage.setItem("edi-speechify-model", model);
      const blob = await response.blob();
      return await playBlob(blob, session);
    }
    return false;
  } catch (e) {
    return false;
  }
}

function playBlob(blob, session) {
  return new Promise((resolve) => {
    const player = new Audio(URL.createObjectURL(blob));
    audioPlayer = player;
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      player.onended = null;
      player.onerror = null;
      resolve(ok);
    };
    player.onended = () => finish(true);
    player.onerror = () => finish(false);
    if (session !== speakSession) return resolve(false);
    player.play().catch(() => finish(false));
  });
}

function speakWithBrowser(text, session, isFallback = false, gender = "M") {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = isFallback ? 1.05 : 1.02;
    utterance.pitch = gender === "M" ? 0.7 : 1;
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter(v => v.lang && v.lang.toLowerCase().replace("_", "-").startsWith("pt-br")
      || (v.lang && v.lang.toLowerCase().startsWith("pt")));
    const matchGender = gender === "M" ? /caio|antonio|thiago|ricardo|homer|daniel|felipe|fabio|male|masculin/i : /natural|neural|francisca|luciana|maria|camila|female|feminin/i;
    const natural = ptVoices.find(v => /natural/i.test(v.name) && matchGender.test(v.name))
      || ptVoices.find(v => matchGender.test(v.name))
      || ptVoices.find(v => /natural|neural|google/i.test(v.name))
      || ptVoices[0];
    if (natural) utterance.voice = natural;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve(true);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}

function setStatus(text, state) {
  statusEl.textContent = text;
  orb.classList.remove("listening", "thinking", "speaking");
  if (state && state !== "idle") orb.classList.add(state);
}

function addMessage(kind, text) {
  const div = document.createElement("div");
  div.className = "msg " + kind;
  if (kind === "user" || kind === "edi") {
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = kind === "user" ? "Você" : "Sil";
    div.appendChild(who);
  }
  div.appendChild(document.createTextNode(text));
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
  window.speechSynthesis.getVoices();
}
