const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, prefer",
};

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const origem = req.headers.get("origin") || "";
  if (origem && !origem.includes("sistemrh.github.io")) {
    return json({ error: "Origem não permitida" }, 403);
  }

  const url = new URL(req.url);
  const acao = url.pathname.split("/").filter(Boolean).pop() || "";
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};

  try {
    if (acao === "chat") return await chat(corpo);
    if (acao === "voz") return await voz(corpo);
    if (acao === "busca") return await busca(corpo);
    return json({ error: "Ação desconhecida" }, 404);
  } catch (e) {
    return json({ error: String(e && e.message ? e.message : e) }, 502);
  }
});

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const SERPAPI_URL = "https://serpapi.com/search.json";
const SPEECHIFY_URL = "https://api.speechify.ai/v1/audio/stream";

function lista(chave: string | undefined): string[] {
  return (chave || "").split(",").map((s) => s.trim()).filter(Boolean);
}

async function chat(corpo: Record<string, unknown>) {
  const modeloGroq = Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-120b";
  let ultimoErro = "sem chaves de inteligência configuradas";

  for (const chave of lista(Deno.env.get("GROQ_KEYS"))) {
    try {
      const r = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + chave },
        body: JSON.stringify({ ...corpo, model: modeloGroq }),
      });
      if (r.ok) return json(await r.json());
      ultimoErro = "groq " + r.status;
      const detalhe = await r.text();
      if (!r.status.toString().startsWith("4")) ultimoErro += " " + detalhe.slice(0, 120);
    } catch (e) {
      ultimoErro = "groq: " + String(e && e.message ? e.message : e);
    }
  }

  const chaveMistral = (Deno.env.get("MISTRAL_KEY") || "").trim();
  if (chaveMistral) {
    try {
      const r = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + chaveMistral },
        body: JSON.stringify({ ...corpo, model: Deno.env.get("MISTRAL_MODEL") || "mistral-small-latest" }),
      });
      if (r.ok) return json(await r.json());
      ultimoErro += " | mistral " + r.status;
    } catch (e) {
      ultimoErro += " | mistral: " + String(e && e.message ? e.message : e);
    }
  }

  return json({ error: ultimoErro }, 502);
}

async function voz(corpo: { input?: string; voice_id?: string; model?: string }) {
  const chaves = lista(Deno.env.get("SPEECHIFY_KEYS"));
  if (!chaves.length) return json({ error: "sem chaves de voz configuradas" }, 502);
  const modelos = [corpo.model, "simba-3.0", "simba-3.2"].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);

  for (const chave of chaves) {
    for (const modelo of modelos) {
      try {
        const r = await fetch(SPEECHIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "audio/mpeg", "Authorization": "Bearer " + chave },
          body: JSON.stringify({ input: corpo.input || "", voice_id: corpo.voice_id || "caio", model: modelo }),
        });
        if (r.ok) {
          return new Response(await r.arrayBuffer(), {
            status: 200,
            headers: { ...CORS, "Content-Type": "audio/mpeg" },
          });
        }
      } catch (_e) { /* próxima chave */ }
    }
  }
  return json({ error: "nenhuma voz disponível" }, 502);
}

async function busca(corpo: { q?: string }) {
  const chave = (Deno.env.get("SERPAPI_KEY") || "").trim();
  if (!chave) return json({ error: "chave de busca não configurada" }, 502);
  const consulta = (corpo.q || "").trim();
  if (!consulta) return json({ error: "busca vazia" }, 400);

  const url = `${SERPAPI_URL}?engine=google&num=5&hl=pt-BR&gl=br&q=${encodeURIComponent(consulta)}&api_key=${chave}`;
  const r = await fetch(url);
  if (!r.ok) return json({ error: "serpapi " + r.status }, 502);
  const dados = await r.json();
  const resultados = (dados.organic_results || []).slice(0, 5).map((x: Record<string, string>) => ({
    titulo: x.title || "",
    resumo: (x.snippet || "").replace(/\s+/g, " ").trim(),
    fonte: (x.link || "").replace(/^https?:\/\/(www\.)?/, "").split("/")[0],
  }));
  return json({ consulta, resultados });
}
