# 🤖 Adner — Assistente Pessoal Inteligente

Assistente pessoal que roda **100% estático no GitHub Pages** — sem servidor e sem custo. Ele conversa com você em português, **anota compromissos sozinho** (agente com *function calling*), **aprende sua rotina** e **fala em voz alta**.

🔗 **Demo:** https://sistemrh.github.io/Adner/

## ✨ O que ele faz

- 💬 **Conversa de verdade** — LLM gratuito (Groq / Llama 3.3 70B) chamado direto do navegador
- 📅 **Agenda autônoma** — diga *"marcar dentista amanhã às 14h"* e a IA anota sozinha via ferramenta; também sabe listar e remover
- 🧠 **Memória** — *"meu nome é..."*, *"eu trabalho na..."*, *"eu gosto de..."* ficam memorizados e alimentam as próximas conversas
- 📊 **Rotina** — analisa seus compromissos e descobre dia mais cheio, horário de pico e atividades recorrentes
- 🔊 **Voz open-source**: opcionalmente roda a rede neural **[Kokoro 82M](https://huggingface.co/hexgrad/Kokoro-82M)** (Apache 2.0) direto no navegador (WebGPU/WASM), com vozes brasileiras **Dora, Alex e Santa** — conta também com 🎤 ditado no Chrome/Edge
- 📦 Tudo fica **no seu navegador** (localStorage) — nenhum servidor próprio

## 🚀 Usar

1. Abra a [página da demo](https://sistemrh.github.io/Adner/)
2. Crie uma chave **gratuita** em [console.groq.com/keys](https://console.groq.com/keys)
3. Cole a chave em **⚙️ Configuração da IA** e salve — pronto, pode conversar!

Sem chave, ele ainda funciona em **modo offline** com comandos: *"minha agenda"*, *"minha rotina"* e anotações simples como *"marcar dentista amanhã às 14h"*.

### Voz open-source no navegador (opcional)

Em **🔊 Voz**, o motor padrão é a rede neural **Kokoro 82M** com a voz masculina **Alex** (pt-BR) — ajuste a velocidade (≈ 0.95 soa mais natural) e use **🔊 Testar voz** para comparar Alex × Santa × Dora. O modelo (~90 MB) é baixado uma única vez, fica em cache no navegador e toda a síntese acontece localmente na aba — nenhum áudio ou texto sai do seu dispositivo. Se algo falhar, cai automaticamente para a voz nativa do navegador.

### IA 100% open-source (opcional, local)

Com o [Ollama](https://ollama.com) rodando na sua máquina, selecione o provedor **Ollama** nas configurações:

```bash
ollama pull llama3.2
OLLAMA_ORIGINS="https://sistemrh.github.io" ollama serve
```

(Rodando localmente em `http://localhost:8000`? Use `OLLAMA_ORIGINS="*"`.)

## 🛠️ Rodando localmente

É um site estático puro — nenhum build:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

## 🗂️ Estrutura

```
index.html   Interface (chat + agenda + configurações)
app.js       Agente: LLM com function calling, agenda, memória, rotina, voz
style.css    Estilos
```

## 🔒 Privacidade

Compromissos, memórias e conversas ficam **no seu navegador** (localStorage). A chave da Groq também. Apenas o texto necessário da conversa é enviado para a API escolhida (Groq ou Ollama local).
