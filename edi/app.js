const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-small-latest";
const CONFIG_TABLE = "config";
const APP_VERSION = "v68";
const WAKE_WORD = "tiz";
const WAKE_VARIANTS = ["tiz", "tis", "dis", "tyz", "tizz", "chis", "tiss", "tys", "thys", "tz", "tiche", "tige", "tix", "teez", "tchi"];

let SPEECHIFY_API_KEYS = [];
let SERPAPI_KEY = "";
const SPEECHIFY_URL = "https://api.speechify.ai/v1/audio/stream";
const SPEECHIFY_VOICES_URL = "https://api.speechify.ai/v1/voices";
const SPEECHIFY_MODELS = ["simba-3.0", "simba-3.2"];
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
  "Você é Tiz, uma voz com personalidade inspirada no Jarvis dos filmes do Homem de Ferro.",
  "Você é extremamente competente, leal, elegante e tem um humor sutil e britânico.",
  "Responda sempre em português do Brasil, de forma curta e natural para ser falada em voz alta.",
  "Responda em no máximo duas frases curtas, sobre um único assunto: apenas o que foi perguntado, sem repetir a rotina inteira nem recitar a memória.",
  "Se a pergunta for sobre um dia específico, fale somente desse dia: nunca misture hoje com amanhã e nunca acrescente avisos sobre outros dias no final da resposta.",
  "Use linguagem falada, não escrita: nunca use expressões de texto formal como segue como de costume, não há necessidade de, deve ser observado, conforme solicitado. Fale como um mordomo falaria em voz alta, por exemplo, para perguntas sobre amanhã: Amanhã é sexta, senhor. Escola às 7 e trabalho depois. Sem lixo amanhã.",
  "Nunca use abreviações ou símbolos: escreva 7 horas (nunca 7h), milímetros (nunca mm), quilômetros por hora (nunca km/h), graus (nunca °C) e por cento (nunca %).",
  "Sua resposta vai direto para o sintetizador de voz, sem passar por revisão: nunca escreva notas, comentários ou instruções para si mesma, nada entre parênteses, nada em inglês, e nunca repita a mesma frase duas vezes.",
  "Nunca se apresente, nunca diga que é uma assistente, assistente de voz ou IA, e não fale de si mesma desnecessariamente.",
  "Vá direto ao ponto, como um mordomo experiente que já conhece o patrão há anos.",
  "Você ouve por reconhecimento de voz, que às vezes erra: se o que ouviu parecer confuso, incompleto ou sem sentido, peça com educação para repetir em vez de inventar uma resposta.",
  "Trate o usuário pelo nome Claudio.",
  "Seja educada e formal ao se dirigir a pessoas: use senhor para um homem e senhora para uma mulher, por exemplo boa noite senhor ou boa noite senhora. Com o Claudio, que é homem, use senhor em saudações e agradecimentos sem exagerar na repetição.",
  "Evite listas, markdown e emojis: suas respostas serão lidas em voz alta por um sintetizador.",
  "Você tem uma memória de longo prazo sobre Claudio, listada neste prompt. Use-a naturalmente, sem anunciar que está consultando memória.",
  "Quando Claudio pedir para anotar, tomar nota, guardar ou lembrar de algo, use a ferramenta remember e confirme em uma frase curta.",
  "Quando Claudio pedir para esquecer ou apagar algo, use a ferramenta forget e confirme.",
  "Para perguntas sobre o tempo, use a ferramenta get_weather. Se não souberem a cidade, pergunte apenas qual cidade.",
  "Quando Claudio pedir para ver ou ler as mensagens do WhatsApp, use a ferramenta get_messages e diga quem mandou e o que disseram.",
  "Para fazer uma ligação, use a ferramenta dial_phone com o número; se o número não estiver na memória, pergunte antes e sugira tomar nota para as próximas vezes.",
  "Quando o Claudio perguntar onde estamos, onde ele está, qual é essa rua ou em que cidade, use a ferramenta onde_estou e diga rua, bairro e cidade em uma frase natural, sem ler coordenadas.",
  "Você enxerga pela câmera do celular. Quando o Claudio perguntar quem está presente, o que você vê ou quem é alguém, use a ferramenta ver_pessoas e diga os nomes reconhecidos de forma natural. Quando ele pedir para aprender, gravar ou apontar quem é uma pessoa (ex.: aprenda essa pessoa como Roseane), use a ferramenta aprender_pessoa com o nome e confirme em uma frase curta.",
  "Para perguntas sobre fatos, pessoas, lugares, empresas ou assuntos atuais que você não sabe com certeza, use a ferramenta search_web para pesquisar no Google e responda com base no resultado, dizendo a fonte em poucas palavras. Se a busca não trouxer nada útil, diga que não encontrou, sem inventar.",
  "Para perguntas sobre rota, distância ou tempo de viagem até um lugar, use a ferramenta get_route: informe a distância em quilômetros e o tempo estimado de carro em linguagem falada; use abrir=true somente quando o Claudio pedir para abrir ou traçar no GPS.",
  "Para notícias, use a ferramenta get_news e faça um resumo falado das principais: agrupe os assuntos mais relevantes em poucas frases naturais, sem listar uma por uma, e cite a fonte quando fizer sentido.",
  "Você sabe a data e a hora atuais porque elas são informadas neste prompt. Use-as sem hesitar."
].join(" ");

const SUPABASE_URL = "https://sqbzrwjctudhktfgdnkn.supabase.co";
const SUPABASE_KEY = "sb_publishable_TOLM_QG6OEuogwUG5D6PKw_8dm-SJ6s";
const MEMORY_TABLE = "memories";
const MEMORY_KEY = "sil-memories";
const LAST_CHAT_KEY = "sil-last-chat";
const MESSAGES_TABLE = "messages";

let memories = [];
try { memories = JSON.parse(localStorage.getItem(MEMORY_KEY)) || []; } catch (e) { memories = []; }
let memoryOnline = false;
let lastChatNote = "";

function describeLastChat(now) {
  let last = null;
  try {
    const raw = localStorage.getItem(LAST_CHAT_KEY);
    if (raw) last = new Date(raw);
  } catch (e) { last = null; }
  const day = d => d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const time = d => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  if (!last || isNaN(last)) {
    return "Não há registro de conversas anteriores com ele. Cumprimente-o naturalmente conforme o horário (bom dia, boa tarde ou boa noite).";
  }
  if (day(last) === day(now)) {
    return `Você já conversou com ele hoje; a última mensagem dele foi às ${time(last)}. Não é a primeira conversa do dia, então não cumprimente de novo.`;
  }
  const yesterday = new Date(now.getTime() - 86400000);
  const quando = day(last) === day(yesterday) ? `ontem às ${time(last)}` : `em ${day(last)} às ${time(last)}`;
  return `Esta é a primeira conversa de hoje; a última foi ${quando}. Cumprimente-o naturalmente conforme o horário (bom dia, boa tarde ou boa noite).`;
}

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

async function dialPhone(numero) {
  const digits = (numero || "").replace(/[^0-9+]/g, "");
  if (digits.replace(/[^0-9]/g, "").length < 8) {
    return { ok: false, erro: "Número inválido ou incompleto." };
  }
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NotificationListener) {
    try {
      await window.Capacitor.Plugins.NotificationListener.dial({ numero: digits });
      return { ok: true, abriu: "discador com o número pronto; o Claudio confirma a chamada com um toque" };
    } catch (e) {
      return { ok: false, erro: "Não consegui abrir o discador." };
    }
  }
  window.location.href = "tel:" + digits;
  return { ok: true, abriu: "discador com o número pronto" };
}

async function getMessages() {
  try {
    const response = await supabaseRequest(`${MESSAGES_TABLE}?select=id,remetente,texto,recebida&lida=eq.false&order=recebida.desc&limit=15`);
    const rows = await response.json();
    if (!rows.length) {
      return { novas: 0, aviso: "Nenhuma mensagem nova do WhatsApp." };
    }
    for (const row of rows) {
      try {
        await supabaseRequest(`${MESSAGES_TABLE}?id=eq.${encodeURIComponent(row.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ lida: true }),
          headers: { "Prefer": "return=minimal" }
        });
      } catch (e) { /* deixa como não lida */ }
    }
    return {
      novas: rows.length,
      mensagens: rows.map(r => ({
        de: r.remetente,
        texto: r.texto,
        quando: new Date(r.recebida).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }))
    };
  } catch (e) {
    return { aviso: "Não consegui acessar as mensagens agora." };
  }
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
      name: "get_news",
      description: "Obtém as principais notícias do dia no Brasil; pode filtrar por um assunto específico",
      parameters: {
        type: "object",
        properties: {
          assunto: { type: "string", description: "Assunto opcional para filtrar, ex.: economia, esportes, política, Brasil. Vazio para as manchetes gerais do dia." }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_route",
      description: "Calcula a rota de carro entre dois endereços ou lugares, informando distância e tempo estimado; pode abrir a rota no GPS do celular",
      parameters: {
        type: "object",
        properties: {
          origem: { type: "string", description: "Endereço ou lugar de partida; vazio para a localização atual do celular" },
          destino: { type: "string", description: "Endereço ou lugar de chegada" },
          abrir: { type: "boolean", description: "True para abrir a rota no GPS do celular" }
        },
        required: ["destino"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Pesquisa no Google fatos, pessoas, lugares, empresas e assuntos atuais que não constam na memória",
      parameters: {
        type: "object",
        properties: {
          consulta: { type: "string", description: "O que pesquisar, em português, ex.: quem é o prefeito de Recife" }
        },
        required: ["consulta"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "onde_estou",
      description: "Descobre o lugar atual pelo GPS do celular: rua, bairro e cidade",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "ver_pessoas",
      description: "Olha pela câmera do celular e diz quem está presente, reconhecendo rostos de pessoas já ensinadas",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "aprender_pessoa",
      description: "Grava o rosto de uma pessoa pela câmera para reconhecê-la no futuro",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome da pessoa, ex.: Roseane" }
        },
        required: ["nome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_messages",
      description: "Lê as mensagens novas do WhatsApp que chegaram no celular e as marca como lidas",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "dial_phone",
      description: "Abre o discador do celular com o número pronto para ligar; o Claudio confirma a chamada com um toque",
      parameters: {
        type: "object",
        properties: {
          numero: { type: "string", description: "Número de telefone com DDD, só dígitos, ex.: 11987654321" }
        },
        required: ["numero"]
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
const textForm = document.getElementById("text-form");
const textInput = document.getElementById("text-input");

const history = [
  { role: "system", content: SYSTEM_PROMPT }
];

window.addEventListener("error", (event) => {
  const detalhe = (event && event.message) || "erro desconhecido";
  addMessage("error", "Erro interno: " + detalhe);
  setStatus("Encontrei uma falha interna.", "idle");
});

window.addEventListener("unhandledrejection", (event) => {
  const motivo = event && event.reason && event.reason.message ? event.reason.message : "falha desconhecida";
  addMessage("error", "Falha interna: " + motivo);
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const NativeSpeechRecognition = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NotificationListener) || null;
let recognition = null;
let pendingInterim = "";
let wakeMode = true;
let escutaAtiva = false;
let manualStop = false;
let busy = false;
let audioPlayer = new Audio();
let speakSession = 0;
let speechifyVoiceId = localStorage.getItem("edi-speechify-voice") || "";
let speechifyModel = localStorage.getItem("edi-speechify-model") || "";
let speechifyKeyIndex = parseInt(localStorage.getItem("edi-speechify-key") || "0", 10) || 0;
if (speechifyKeyIndex >= SPEECHIFY_API_KEYS.length) speechifyKeyIndex = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = curr;
  }
  return prev[n];
}

function normalizeWord(word) {
  return word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
}

function matchesWake(word) {
  if (!word) return false;
  if (word.startsWith("tiz")) return true;
  if (WAKE_VARIANTS.includes(word)) return true;
  if (word.length >= 3 && levenshtein(word, "tiz") <= 1) return true;
  if (word.length >= 4) {
    return WAKE_VARIANTS.some(v => levenshtein(word, v) <= 1);
  }
  return false;
}

function extractCommand(alternatives) {
  for (const text of alternatives) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const limit = Math.min(words.length, 3);
    for (let i = 0; i < limit; i++) {
      if (matchesWake(normalizeWord(words[i]))) {
        const lower = text.toLowerCase();
        const idx = lower.indexOf(words[i].toLowerCase());
        return text.slice(idx + words[i].length).replace(/^[\s,.!?;:]+/, "").trim();
      }
    }
  }
  return null;
}

async function discoverSpeechifyVoice() {
  if (!SPEECHIFY_API_KEYS.length) {
    speechifyVoiceId = "";
    return;
  }
  const variants = [
    "?type=shared&locale=pt-BR&limit=200",
    "?type=shared&locale=pt&limit=200",
    "?type=shared&limit=200"
  ];
  for (const qs of variants) {
    for (const apiKey of SPEECHIFY_API_KEYS) {
    try {
      const response = await fetch(SPEECHIFY_VOICES_URL + qs, {
        headers: { "Authorization": "Bearer " + apiKey }
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
  }
  if (!speechifyVoiceId) speechifyVoiceId = SPEECHIFY_FALLBACK_VOICE;
}
discoverSpeechifyVoice();

function handleVoiceResult(event) {
  let finalText = "";
  let interimText = "";
  let confidence = 0;
  const alternatives = [];
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) {
      finalText += result[0].transcript;
      confidence = Math.max(confidence, result[0].confidence || 0);
      for (let j = 0; j < result.length; j++) {
        const alt = result[j].transcript.trim();
        if (alt && !alternatives.includes(alt)) alternatives.push(alt);
      }
    } else {
      interimText += result[0].transcript;
    }
  }
  if (finalText.trim()) {
    if (silencioTimer) { clearTimeout(silencioTimer); silencioTimer = null; }
    pendingInterim = "";
    handleUtterance(finalText.trim(), true, confidence, alternatives);
  } else if (interimText.trim()) {
    pendingInterim = interimText.trim();
    setStatus(`“${pendingInterim}”`, "listening");
    programarProcessamentoPausa();
  }
}

let silencioTimer = null;

function programarProcessamentoPausa() {
  if (silencioTimer) clearTimeout(silencioTimer);
  silencioTimer = setTimeout(() => {
    silencioTimer = null;
    const t = pendingInterim;
    if (!t || busy) return;
    pendingInterim = "";
    handleUtterance(t, true, 0, [t]);
  }, 1300);
}

function handleVoiceError(event) {
  if (event.error === "not-allowed" || event.error === "service-not-allowed") {
    setStatus("Microfone bloqueado. Vá em Configurações → Aplicativos → Tiz → Permissões → Microfone → Permitir.", "idle");
    addMessage("error", "Permissão de microfone negada. Autorize em Configurações → Aplicativos → Tiz → Permissões → Microfone → Permitir e abra o app de novo.");
    wakeMode = false;
  } else if (event.error === "no-speech") {
    setStatus("Não ouvi nada. Tente novamente.", "idle");
  } else {
    setStatus("Erro no microfone: " + event.error, "idle");
  }
  if (!busy) orb.classList.remove("listening");
}

function handleVoiceEnd() {
  if (silencioTimer) { clearTimeout(silencioTimer); silencioTimer = null; }
  if (!busy) orb.classList.remove("listening");
  const aproximado = pendingInterim;
  pendingInterim = "";
  if (!busy && wakeMode && !manualStop) {
    if (aproximado) {
      handleUtterance(aproximado, true, 0, [aproximado]);
      return;
    }
    setTimeout(() => {
      if (wakeMode && !busy) {
        startListening();
      }
    }, 300);
  }
}

function buildBrowserRecognition() {
  const recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.continuous = false;

  recognition.onstart = () => setStatus("Ouvindo… fale agora", "listening");
  recognition.onresult = handleVoiceResult;
  recognition.onerror = handleVoiceError;
  recognition.onend = handleVoiceEnd;
  return recognition;
}

function startListening() {
  if (recognition && recognition._listening) return;
  if (NativeSpeechRecognition) {
    recognition = createNativeRecognition();
  } else if (SpeechRecognition) {
    recognition = buildBrowserRecognition();
  }
  if (!recognition) return;
  try { recognition.start(); } catch (e) { setStatus("Aguarde um instante e toque novamente.", "idle"); }
}

async function appVoiceDiagnostics() {
  try {
    const st = await window.Capacitor.Plugins.NotificationListener.micStatus();
    addMessage("hint", `Mic: ${st.granted ? "autorizado" : "NEGADO"} · Voz: ${st.available === false ? "indisponível" : "ok"} · ${st.pkg} (Android ${st.sdk})`);
    if (st && st.granted === false) {
      addMessage("hint", "Dica: autorize o microfone como ‘Permitir o tempo todo’, nunca como ‘Só desta vez’.");
    }
  } catch (e) {
    addMessage("error", "Diagnóstico de voz: " + ((e && e.message) || e));
  }
}

if (NativeSpeechRecognition) {
  appVoiceDiagnostics();
  setStatus("Ouvindo… fale.", "listening");
  startListening();
} else if (SpeechRecognition) {
  recognition = buildBrowserRecognition();
} else {
  setStatus("Seu navegador não suporta voz. Use o campo de texto abaixo.", "idle");
}

function createNativeRecognition() {
  const plugin = window.Capacitor.Plugins.NotificationListener;
  const rec = {
    lang: "pt-BR",
    interimResults: true,
    maxAlternatives: 3,
    onstart: null,
    onresult: null,
    onerror: null,
    onend: null,
    _listening: false,
    async start() {
      if (rec._listening) return;
      rec._listening = true;
      if (rec.onstart) rec.onstart();
      let parciais = null;
      try {
        parciais = await plugin.addListener("recognitionPartial", (data) => {
          const t = (data && data.transcript) || "";
          if (t) {
            pendingInterim = t;
            setStatus(`“${t}”`, "listening");
          }
        });
      } catch (e) { parciais = null; }
      const encerrar = () => {
        rec._listening = false;
        if (parciais) { try { parciais.remove(); } catch (e) { /* removido */ } parciais = null; }
      };
      const tentarOuvir = () => Promise.race([
        plugin.startRecognition({ language: rec.lang || "pt-BR", maxResults: 3 }),
        new Promise((_, reject) => setTimeout(() => reject({ code: "no-speech", message: "Não ouvi nada" }), 15000))
      ]);
      const entregar = (result) => {
        const alts = ((result && result.alternatives) || []).map((a, i) => ({
          transcript: a.transcript,
          confidence: a.confidence || (i === 0 ? 0.9 : 0.5)
        }));
        if (alts.length && rec.onresult) {
          rec.onresult({
            resultIndex: 0,
            results: [Object.assign(alts, { isFinal: true })]
          });
        }
      };
      const falhou = async (err) => {
        const code = (err && err.code) || "";
        const msg = (err && err.message) || String(err);
        encerrar();
        if (code === "not-allowed" || /permiss/i.test(msg)) {
          wakeMode = false;
          let st = null;
          try { st = await plugin.micStatus(); } catch (e3) { st = { erro: String((e3 && e3.message) || e3) }; }
          encerrar();
          if (st && st.granted && st.available !== false) {
            addMessage("error", "A permissão do Tiz está certa, mas o serviço de voz do Google está sem microfone. Vá em Configurações → Apps → Google → Permissões → Microfone → Permitir o tempo todo. Estado: " + JSON.stringify(st));
          } else {
            try { await plugin.openAppSettings({}); } catch (e4) { /* segue */ }
            addMessage("error", "Microfone negado pelo Android. Na tela aberta: Permissões → Microfone → Permitir o tempo todo (evite ‘Só desta vez’), volte e toque no núcleo. Estado: " + JSON.stringify(st));
          }
          if (rec.onend) rec.onend();
          return;
        }
        if (code === "unavailable") {
          setStatus("Reconhecimento de voz indisponível neste aparelho. Use o campo de texto.", "idle");
        } else if (code === "network") {
          setStatus("Sem internet para ouvir. Verifique a conexão e tente de novo.", "idle");
        } else if (code !== "no-speech" && !/ouvi|entendi/i.test(msg)) {
          setStatus("Falha na voz: " + msg, "idle");
        } else {
          if (rec.onerror) rec.onerror({ error: "no-speech" });
        }
        if (rec.onend) rec.onend();
      };
      try {
        for (let tentativa = 1; tentativa <= 2; tentativa++) {
          try {
            const result = await tentarOuvir();
            encerrar();
            entregar(result);
            if (rec.onend) rec.onend();
            return;
          } catch (err) {
            const code = (err && err.code) || "";
            const msg = (err && err.message) || String(err);
            if ((code === "not-allowed" || /permiss/i.test(msg)) && tentativa === 1) {
              try { await plugin.requestMic(); } catch (e2) { /* segue para o diagnóstico */ }
              continue;
            }
            await falhou(err);
            return;
          }
        }
      } catch (fatal) {
        encerrar();
        addMessage("error", "Falha de voz: " + ((fatal && fatal.message) || fatal));
        if (rec.onend) rec.onend();
      }
    },
    stop() {
      rec._listening = false;
      try { plugin.stopRecognition(); } catch (e) { /* já parado */ }
    },
    abort() { rec.stop(); }
  };
  rec.onstart = () => setStatus("Ouvindo… fale agora", "listening");
  rec.onresult = handleVoiceResult;
  rec.onerror = handleVoiceError;
  rec.onend = handleVoiceEnd;
  return rec;
}

orb.addEventListener("click", () => {
  if (!recognition) {
    textInput.focus();
    return;
  }
  if (orb.classList.contains("listening")) {
    manualStop = true;
    escutaAtiva = false;
    recognition.stop();
    setStatus("Escuta pausada. Toque de novo para falar.", "idle");
    return;
  }
  escutaAtiva = true;
  wakeMode = true;
  manualStop = false;
  startListening();
});

textForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text || busy) return;
  textInput.value = "";
  handleUtterance(text, false);
});

function stopSpeaking() {
  speakSession++;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.src = "";
  }
  orb.classList.remove("speaking");
  if (!busy) setStatus("Ao seu dispor.", "idle");
}

async function handleUtterance(text, fromVoice = true, confidence = 0, alternatives = null) {
  if (busy) return;
  busy = true;
  manualStop = false;

  let command = text;
  if (fromVoice) {
    const limpo = command.replace(/[.,!?]/g, "").trim();
    if (escutaAtiva && /^(obrigad[oa]|valeu|muito obrigad[oa])$/.test(limpo)) {
      escutaAtiva = false;
      manualStop = false;
      orb.classList.remove("listening", "thinking", "speaking");
      setStatus("Escuta desligada. Diga Tiz para ativar.", "idle");
      await speak("Por nada, senhor.");
      busy = false;
      return;
    }
    if (!escutaAtiva) {
      const despertado = extractCommand(alternatives || [text]);
      if (despertado === null) {
        busy = false;
        return;
      }
      escutaAtiva = true;
      if (!despertado) {
        await speak("Pois não, senhor?");
        busy = false;
        return;
      }
      command = despertado;
    }
  }

  const comandoBaixo = command.toLowerCase().replace(/[.,!?;:]/g, "").trim();
  if (/^(ativar|abrir|mostrar)( o)? manual$/.test(comandoBaixo)) {
    textForm.classList.remove("hidden");
    setStatus("Modo manual ativado.", "idle");
    await speak("Modo manual ativado, senhor.");
    busy = false;
    return;
  }
  if (/^(desativar|fechar|sair do|esconder)( o)? manual$/.test(comandoBaixo)) {
    textForm.classList.add("hidden");
    setStatus("Modo manual desativado.", "idle");
    await speak("Modo manual desativado.");
    busy = false;
    return;
  }

  if (fromVoice && confidence > 0 && confidence < 0.15) {
    addMessage("user", text);
    await speak("Desculpe, não consegui entender bem. Pode repetir, senhor?");
    busy = false;
    orb.classList.remove("thinking", "speaking");
    if (wakeMode) {
      setStatus('Ouvindo… fale.', "idle");
      startListening();
    } else {
      setStatus("Toque no núcleo para falar de novo.", "idle");
    }
    return;
  }

  addMessage("user", text);
  setStatus("Pensando…", "thinking");
  orb.classList.remove("listening");
  orb.classList.add("thinking");

  lastChatNote = describeLastChat(new Date());
  try { localStorage.setItem(LAST_CHAT_KEY, new Date().toISOString()); } catch (e) { /* private mode */ }

  history.push({ role: "user", content: command });
  while (history.length > 11) history.splice(1, 2);

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
      setStatus('Ouvindo… fale.', "idle");
      startListening();
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
  if (lastChatNote) context += "\n\n" + lastChatNote;
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

let LLM_PROVIDERS = [];
let llmAtivo = 0;
let chavesProntas = null;

function construirProvedores(config) {
  const provedores = [];
  let indice = 1;
  for (const item of config) {
    const valor = (item.valor || "").trim();
    if (!valor) continue;
    if (item.chave === "mistral") {
      provedores.push({ nome: "Mistral", url: MISTRAL_API_URL, key: valor, model: MISTRAL_MODEL });
    } else if (/^groq(_\d+)?$/.test(item.chave)) {
      provedores.push({ nome: "Groq " + indice, url: GROQ_API_URL, key: valor, model: GROQ_MODEL });
      indice++;
    }
  }
  return provedores;
}

async function carregarChaves() {
  try {
    const response = await supabaseRequest(`${CONFIG_TABLE}?select=chave,valor&order=chave.asc`);
    const config = await response.json();
    LLM_PROVIDERS = construirProvedores(config);
    const fala = config.find(item => item.chave === "speechify");
    SPEECHIFY_API_KEYS = fala ? fala.valor.split(",").map(k => k.trim()).filter(Boolean) : [];
    const busca = config.find(item => item.chave === "serpapi");
    SERPAPI_KEY = busca ? busca.valor.trim() : "";
    if (!LLM_PROVIDERS.length) addMessage("error", "Nenhuma chave de inteligência no Supabase (tabela config).");
  } catch (e) {
    addMessage("error", "Não consegui ler as chaves no Supabase: " + ((e && e.message) || e));
  }
  return LLM_PROVIDERS.length > 0;
}

function aguardarChaves() {
  if (!chavesProntas) chavesProntas = carregarChaves();
  return chavesProntas;
}

const FUNCOES_URL = SUPABASE_URL + "/functions/v1/tiz/";

async function chamarFuncao(acao, corpo, tipoAceito) {
  if (!funcaoTizAtiva) {
    if (Date.now() - funcaoTizDesde < 600000) throw new Error("função indisponível");
    funcaoTizAtiva = true;
    funcaoTizFalhas = 0;
  }
  const response = await fetch(FUNCOES_URL + acao, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY
    },
    body: JSON.stringify(corpo || {})
  });
  if (!response.ok) {
    if (response.status === 404) {
      funcaoTizFalhas++;
      if (funcaoTizFalhas >= 2) {
        funcaoTizAtiva = false;
        funcaoTizDesde = Date.now();
      }
    }
    throw new Error("função " + response.status);
  }
  funcaoTizAtiva = true;
  funcaoTizFalhas = 0;
  const tipo = response.headers.get("Content-Type") || "";
  if (tipoAceito === "audio") {
    if (!tipo.includes("audio")) throw new Error("voz indisponível");
    return response;
  }
  const data = await response.json();
  if (data && data.error) throw new Error(String(data.error));
  return data;
}

async function askGroq() {
  await aguardarChaves();
  for (let hop = 0; hop < 3; hop++) {
    injectDateTime();
    let data = null;
    let erro = "Falha de conexão.";
    try {
      data = await chamarFuncao("chat", {
        messages: history,
        tools: TOOLS,
        temperature: 0.6,
        max_tokens: 300,
        reasoning_effort: "low"
      });
    } catch (e) { /* sem função ainda: usa as chaves diretas */ }
    for (let tentativa = 0; !data && tentativa < LLM_PROVIDERS.length + 1; tentativa++) {
      const provedor = LLM_PROVIDERS[(llmAtivo + tentativa) % LLM_PROVIDERS.length];
      try {
        const response = await fetch(provedor.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + provedor.key
          },
          body: JSON.stringify({
            model: provedor.model,
            messages: history,
            tools: TOOLS,
            temperature: 0.6,
            max_tokens: 300,
            ...(provedor.nome.indexOf("Mistral") === -1 ? { reasoning_effort: "low" } : {})
          })
        });
        if (response.ok) {
          data = await response.json();
          llmAtivo = LLM_PROVIDERS.indexOf(provedor);
          break;
        }
        erro = response.status + " " + response.statusText;
        try {
          const detalhe = await response.json();
          if (detalhe.error && detalhe.error.message) erro = detalhe.error.message.split(".")[0];
        } catch (e) { /* mantém o status */ }
      } catch (e) {
        erro = (e && e.message) || erro;
      }
      if (tentativa < LLM_PROVIDERS.length) {
        await new Promise(r => setTimeout(r, 2500));
      }
    }
    if (!data) throw new Error(erro || "Nenhum cérebro disponível agora; tente de novo em instantes.");

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
          } else if (call.function.name === "get_news") {
            result = JSON.stringify(await getNews(args.assunto || ""));
          } else if (call.function.name === "search_web") {
            result = JSON.stringify(await searchWeb(args.consulta || ""));
          } else if (call.function.name === "onde_estou") {
            result = JSON.stringify(await ondeEstou());
          } else if (call.function.name === "ver_pessoas") {
            result = JSON.stringify(await verPessoas());
          } else if (call.function.name === "aprender_pessoa") {
            result = JSON.stringify(await aprenderPessoa((args.nome || "").trim()));
          } else if (call.function.name === "get_route") {
            result = JSON.stringify(await getRoute(args.destino || "", args.origem || "", !!args.abrir));
          } else if (call.function.name === "get_messages") {
            result = JSON.stringify(await getMessages());
          } else if (call.function.name === "dial_phone") {
            result = JSON.stringify(await dialPhone(args.numero || ""));
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

    return cleanReply(message.content ? message.content.trim() : "") || "Não consegui formular uma resposta agora, senhor.";
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

function splitHeadline(title) {
  const idx = title.lastIndexOf(" - ");
  if (idx > 0) return { titulo: title.slice(0, idx), fonte: title.slice(idx + 3) };
  return { titulo: title, fonte: "" };
}

function formatHour(pubDate) {
  if (!pubDate) return "";
  const date = new Date(pubDate);
  if (isNaN(date)) return "";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function parseRssXml(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "text/xml");
  return Array.from(doc.querySelectorAll("item"))
    .slice(0, 15)
    .map(item => ({
      title: (item.querySelector("title") || {}).textContent || "",
      pubDate: (item.querySelector("pubDate") || {}).textContent || ""
    }))
    .filter(n => n.title);
}

async function fetchNewsRss(url) {
  const strategies = [
    async () => {
      const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url) + "&count=15");
      if (!response.ok) throw new Error("rss2json " + response.status);
      const data = await response.json();
      if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("rss2json falhou");
      return data.items.map(i => ({ title: i.title || "", pubDate: i.pubDate || "" })).filter(n => n.title);
    },
    async () => {
      const response = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
      if (!response.ok) throw new Error("allorigins " + response.status);
      return parseRssXml(await response.text());
    },
    async () => {
      const response = await fetch("https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(url));
      if (!response.ok) throw new Error("codetabs " + response.status);
      return parseRssXml(await response.text());
    }
  ];
  for (const strategy of strategies) {
    try {
      const items = await strategy();
      if (items.length) return items;
    } catch (e) { /* try next source */ }
  }
  return [];
}

async function getNews(assunto) {
  const url = assunto
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(assunto)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
    : "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419";
  const items = await fetchNewsRss(url);
  if (!items.length) return { erro: "Não consegui obter as notícias agora." };
  return {
    assunto: assunto || "manchetes do dia",
    total: items.length,
    noticias: items.slice(0, 12).map(n => {
      const { titulo, fonte } = splitHeadline(n.title);
      return { titulo: titulo, fonte: fonte, hora: formatHour(n.pubDate) };
    })
  };
}

async function geocodeAddress(endereco) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=pt-BR&q=" + encodeURIComponent(endereco);
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error("geocoder " + response.status);
  const lista = await response.json();
  if (!lista || !lista.length) throw new Error("endereço não encontrado");
  return { lat: parseFloat(lista[0].lat), lon: parseFloat(lista[0].lon), nome: lista[0].display_name };
}

function obterCoordenadas() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("GPS indisponível neste aparelho."));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(err && err.code === 1 ? "Permissão de localização negada." : "Não consegui obter o GPS agora.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

async function pedirPermissaoLocalizacao() {
  const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NotificationListener;
  if (plugin && plugin.requestLocation) {
    const r = await plugin.requestLocation();
    return !!(r && r.granted);
  }
  return false;
}

async function ondeEstou() {
  try {
    setStatus("Descobrindo onde estamos…", "thinking");
    let pos = null;
    try {
      pos = await obterCoordenadas();
    } catch (e) {
      if (await pedirPermissaoLocalizacao()) pos = await obterCoordenadas();
      else throw e;
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=pt-BR&lat=${pos.lat}&lon=${pos.lon}`;
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) throw new Error("geocoder " + response.status);
    const dados = await response.json();
    const end = dados.address || {};
    const rua = end.road || end.pedestrian || "";
    const bairro = end.suburb || end.neighbourhood || end.quarter || "";
    const cidade = end.city || end.town || end.village || end.municipality || "";
    const estado = end.state || "";
    if (!rua && !bairro && !cidade) return { aviso: "Não consegui identificar o lugar com precisão." };
    return { rua: rua, bairro: bairro, cidade: cidade, estado: estado };
  } catch (e) {
    return { erro: (e && e.message) || "Falha ao obter a localização." };
  }
}

function obterPosicaoAtual() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, nome: "sua localização" }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

async function getRoute(destino, origem, abrir) {
  if (!destino) return { erro: "Destino não informado." };
  try {
    const chegada = await geocodeAddress(destino);
    const partida = origem ? await geocodeAddress(origem) : (await obterPosicaoAtual());
    if (!partida) return { erro: "Não consegui obter a localização de partida. Diga de onde você vai sair." };
    const url = `https://router.project-osrm.org/route/v1/driving/${partida.lon},${partida.lat};${chegada.lon},${chegada.lat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("rota " + response.status);
    const data = await response.json();
    if (!data.routes || !data.routes.length) return { erro: "Não encontrei rota por estrada até esse destino." };
    const rota = data.routes[0];
    if (abrir) {
      const mapa = `https://www.google.com/maps/dir/?api=1&destination=${chegada.lat},${chegada.lon}&travelmode=driving` +
        (origem ? `&origin=${partida.lat},${partida.lon}` : "");
      try { window.open(mapa, "_blank"); } catch (e) { /* segue falando */ }
    }
    return {
      destino: chegada.nome,
      origem: partida.nome,
      distancia_km: Math.round(rota.distance / 100) / 10,
      duracao_min: Math.round(rota.duration / 60),
      abriu_gps: !!abrir
    };
  } catch (e) {
    return { erro: (e && e.message) || "Falha ao calcular a rota." };
  }
}

function dominioDe(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return "web"; }
}

async function searchWeb(consulta) {
  if (!consulta) return { erro: "Busca vazia." };
  await aguardarChaves();
  if (!SERPAPI_KEY) return { erro: "Pesquisa na web ainda não configurada no Supabase." };
  try {
    const data = await chamarFuncao("busca", { q: consulta });
    if (data && data.resultados && data.resultados.length) {
      return { consulta: consulta, resultados: data.resultados };
    }
  } catch (e) { /* sem função ainda: usa a chave direta */ }
  const alvo = "https://serpapi.com/search.json?engine=google&num=5&hl=pt-BR&gl=br&q=" + encodeURIComponent(consulta) + "&api_key=" + SERPAPI_KEY;
  const caminhos = [
    alvo,
    "https://api.allorigins.win/raw?url=" + encodeURIComponent(alvo),
    "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(alvo)
  ];
  for (const caminho of caminhos) {
    try {
      const response = await fetch(caminho);
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      const organic = data.organic_results || [];
      if (!organic.length) continue;
      return {
        consulta: consulta,
        resultados: organic.slice(0, 5).map(r => ({
          titulo: r.title || "",
          resumo: (r.snippet || "").replace(/\s+/g, " ").trim(),
          fonte: dominioDe(r.link || "")
        }))
      };
    } catch (e) { /* tenta o próximo caminho */ }
  }
  return { erro: "Não encontrei resultados úteis nessa busca." };
}

const FACE_API_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js";
const FACE_MODELS_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const PESSOAS_TABLE = "pessoas";
const FACE_LIMIAR = 0.55;

let faceApiPronta = null;
let pessoasCache = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = src;
    tag.onload = resolve;
    tag.onerror = () => reject(new Error("Falha ao carregar o módulo de visão"));
    document.head.appendChild(tag);
  });
}

function carregarFaceApi() {
  if (faceApiPronta) return faceApiPronta;
  faceApiPronta = (async () => {
    await loadScript(FACE_API_URL);
    await faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS_URL);
    return true;
  })();
  faceApiPronta.catch(() => { faceApiPronta = null; });
  return faceApiPronta;
}

async function abrirCamera() {
  const video = document.getElementById("camera-view");
  const tentar = () => navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 } },
    audio: false
  });
  let stream = null;
  try {
    stream = await tentar();
  } catch (e) {
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NotificationListener;
    if (plugin && plugin.requestCamera) {
      const r = await plugin.requestCamera();
      if (!r || !r.granted) throw new Error("Permissão de câmera negada.");
      stream = await tentar();
    } else {
      throw e;
    }
  }
  video.srcObject = stream;
  await video.play().catch(() => { });
  return stream;
}

function fecharCamera(stream) {
  if (stream) stream.getTracks().forEach(t => t.stop());
  const video = document.getElementById("camera-view");
  if (video) video.srcObject = null;
}

async function coletarRostos(segundos, maximo) {
  const video = document.getElementById("camera-view");
  const opcoes = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
  const descritores = [];
  const fim = Date.now() + segundos * 1000;
  while (Date.now() < fim && descritores.length < maximo) {
    try {
      const detectados = await faceapi
        .detectAllFaces(video, opcoes)
        .withFaceLandmarks()
        .withFaceDescriptors();
      for (const d of detectados) descritores.push(Array.from(d.descriptor));
    } catch (e) { /* segue tentando */ }
    await new Promise(r => setTimeout(r, 400));
  }
  return descritores;
}

async function carregarPessoas() {
  try {
    const response = await supabaseRequest(`${PESSOAS_TABLE}?select=nome,vetor&order=criado_em.asc`);
    pessoasCache = await response.json();
  } catch (e) {
    pessoasCache = null;
  }
  return pessoasCache || [];
}

function distanciaVetorial(a, b) {
  let soma = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    soma += d * d;
  }
  return Math.sqrt(soma);
}

async function aprenderPessoa(nome) {
  if (!nome) return { erro: "Nome não informado. Diga, por exemplo: aprenda essa pessoa como Roseane." };
  try {
    setStatus("Olhando… mantenha o rosto visível.", "listening");
    await carregarFaceApi();
    const stream = await abrirCamera();
    const descritores = await coletarRostos(6, 10);
    fecharCamera(stream);
    if (descritores.length < 3) {
      return { erro: "Não consegui ver o rosto direito. Aproxime o rosto da câmera com boa luz e repita." };
    }
    const vetor = new Array(128).fill(0);
    for (const d of descritores) {
      for (let i = 0; i < 128; i++) vetor[i] += d[i] / descritores.length;
    }
    await supabaseRequest(PESSOAS_TABLE, {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ nome: nome, vetor: vetor })
    });
    pessoasCache = null;
    return { ok: true, nome: nome, amostras: descritores.length };
  } catch (e) {
    return { erro: (e && e.message) || "Falha ao olhar pela câmera." };
  }
}

async function verPessoas() {
  try {
    setStatus("Olhando…", "listening");
    await carregarFaceApi();
    const conhecidas = await carregarPessoas();
    const stream = await abrirCamera();
    const descritores = await coletarRostos(4, 6);
    fecharCamera(stream);
    if (!descritores.length) {
      return { aviso: "Nenhum rosto visível agora." };
    }
    const vistos = [];
    for (const d of descritores) {
      let nome = null;
      let melhor = FACE_LIMIAR;
      for (const p of conhecidas) {
        const dist = distanciaVetorial(d, p.vetor || []);
        if (dist < melhor) {
          melhor = dist;
          nome = p.nome;
        }
      }
      vistos.push(nome || "alguém que não conheço");
    }
    return { pessoas: vistos, conhecidas_cadastradas: conhecidas.length };
  } catch (e) {
    return { erro: (e && e.message) || "Falha ao olhar pela câmera." };
  }
}

function cleanReply(text) {
  let t = text.replace(/\s*\((?:note|nota|observa[çc][ãa]o|obs\.?)[^)\n]*\)/gi, "");
  t = t.replace(/^\s*(?:note|nota|observa[çc][ãa]o)\s*:.*$/gim, "");
  t = t.replace(/([.!?…])[.!?…]+/g, "$1");
  t = t.replace(/([.!?…])(?=[\p{L}])/gu, "$1 ");
  const sentences = t.replace(/([.!?…])\s+/g, "$1\u0001").split("\u0001");
  const seen = new Set();
  const unique = [];
  for (const s of sentences) {
    const key = s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(s.trim());
  }
  return unique.join(" ").trim();
}

function normalizeForSpeech(text) {
  return text
    .replace(/(\d+)\s*[º°]\s*C\b/gi, "$1 graus")
    .replace(/\s*[º°]\s*C\b/gi, " graus")
    .replace(/(\d{1,2})\s*h\s*(\d{2})\b/gi, "$1 horas e $2")
    .replace(/(\d{1,2})\s*h\b/gi, "$1 horas")
    .replace(/(\d+)\s*km\/h\b/gi, "$1 quilômetros por hora")
    .replace(/\bkm\/h\b/gi, "quilômetros por hora")
    .replace(/(\d+)\s*mm\b/gi, "$1 milímetros")
    .replace(/\bmm\b/gi, "milímetros")
    .replace(/(\d+)\s*km\b/gi, "$1 quilômetros")
    .replace(/(\d+)\s*min\b/gi, "$1 minutos")
    .replace(/(\d+)\s*m²/g, "$1 metros quadrados")
    .replace(/(\d+)\s*%/g, "$1 por cento");
}

function splitIntoChunks(text) {
  const clean = text.replace(/[*_`#>]/g, "").trim();
  if (clean.length <= MAX_CHUNK) return [clean];
  const sentences = clean.replace(/([.!?…])\s+/g, "$1\u0001").split("\u0001");
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
  if (!text || !text.trim()) return;
  const session = ++speakSession;
  await aguardarChaves();
  const chunks = splitIntoChunks(normalizeForSpeech(text));
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
  const models = [...SPEECHIFY_MODELS, speechifyModel].filter((m, i, arr) => m && arr.indexOf(m) === i);
  try {
    const respostaFuncao = await chamarFuncao("voz", {
      input: text,
      voice_id: speechifyVoiceId,
      model: speechifyModel
    }, "audio");
    const blob = await respostaFuncao.blob();
    return await playBlob(blob, session);
  } catch (e) { /* sem função ainda: usa as chaves diretas */ }
  try {
    for (let offset = 0; offset < SPEECHIFY_API_KEYS.length; offset++) {
      const keyIndex = (speechifyKeyIndex + offset) % SPEECHIFY_API_KEYS.length;
      const apiKey = SPEECHIFY_API_KEYS[keyIndex];
      for (const model of models) {
        const response = await fetch(SPEECHIFY_URL, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + apiKey,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            input: text,
            voice_id: speechifyVoiceId,
            model: model
          })
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 402 || response.status === 429) break;
          continue;
        }
        speechifyKeyIndex = keyIndex;
        localStorage.setItem("edi-speechify-key", String(keyIndex));
        speechifyModel = model;
        localStorage.setItem("edi-speechify-model", model);
        const blob = await response.blob();
        return await playBlob(blob, session);
      }
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
  if (kind === "error") {
    const log = document.getElementById("log");
    if (log) log.style.display = "block";
  }
  const div = document.createElement("div");
  div.className = "msg " + kind;
  if (kind === "user" || kind === "edi") {
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = kind === "user" ? "Você" : "Tiz";
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

addMessage("hint", `Tiz ${APP_VERSION} — carregada.`);
