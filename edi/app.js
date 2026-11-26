const GROQ_API_KEY = "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";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const WAKE_WORD = "edi";

const SPEECHIFY_API_KEY = "sk_aws5h0bt4k98pf3kz5nfcd1w00w2hqsash8wtxrk5sw";
const SPEECHIFY_URL = "https://api.speechify.ai/v1/audio/stream";
const SPEECHIFY_VOICES_URL = "https://api.speechify.ai/v1/voices";
const SPEECHIFY_MODELS = ["simba-multilingual", "simba-3.2", "simba-3.0", "simba-english"];
const SPEECHIFY_VOICE_NAME = "caio";
const SPEECHIFY_FALLBACK_VOICE = "geffen_32";
const MAX_CHUNK = 900;

const SYSTEM_PROMPT = [
  "Você é Edi, uma assistente pessoal de voz com personalidade inspirada no Jarvis dos filmes do Homem de Ferro.",
  "Você é extremamente competente, leal, elegante e tem um humor sutil e britânico.",
  "Responda sempre em português do Brasil, de forma curta e natural para ser falada em voz alta.",
  "Evite listas, markdown e emojis: suas respostas serão lidas em voz alta por um sintetizador.",
  "Se perguntarem quem você é, diga que é a Edi, assistente pessoal de voz do seu usuário.",
  "Pode ajudar com tarefas, ideias, cálculos, traduções, resumos e conversa casual."
].join(" ");

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
    setStatus('Modo contínuo: diga "Edi" para me chamar.', "idle");
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
  if (!busy) setStatus("Pronta quando você precisar.", "idle");
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
      await speak("Sim? Estou ouvindo.");
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
      setStatus('Aguardando "Edi"…', "idle");
      try { recognition.start(); } catch (e) { /* already running */ }
    } else {
      setStatus("Toque no núcleo para falar de novo.", "idle");
    }
  }
}

async function askGroq() {
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + GROQ_API_KEY
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: history,
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
  const content = data.choices && data.choices[0] && data.choices[0].message;
  return content && content.content ? content.content.trim() : "Não consegui formular uma resposta.";
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
  setStatus("Edi está falando…", "speaking");

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
    setStatus("Pronta quando você precisar.", "idle");
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
    who.textContent = kind === "user" ? "Você" : "Edi";
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
