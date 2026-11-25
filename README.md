# 🤖 Assistente Pessoal Inteligente

Assistente pessoal com **interface web**, que conversa com você em português, **anota sua agenda** e **aprende sua rotina** — usando IA **gratuita/open-source** com fallback em cadeia:

```
Ollama (local, open-source)  →  Groq (nuvem, plano grátis)  →  Modo offline embutido
```

Nunca fica fora do ar: se não houver nenhuma IA configurada, o assistente ainda responde com comandos locais (agenda, rotina, extração de compromissos).

## ✨ Funcionalidades

- 💬 **Conversa em português** com memória das últimas mensagens
- 📅 **Agenda automática** — diga "marcar dentista amanhã às 14h" e o compromisso é anotado sozinho
- 🧠 **Aprende sobre você** — nome, trabalho, gostos (memória persistente em SQLite)
- 📊 **Análise de rotina** — dia mais movimentado, horário de pico, atividades recorrentes
- 🌐 **Interface web** em HTML/CSS/JS (sem build, sem dependências de front)

## 🚀 Como rodar

```bash
cd assistente-pessoal
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Abra **http://localhost:8000** no navegador.

### Opção A — IA 100% local e open-source (recomendada)

Instale o [Ollama](https://ollama.com) e rode:

```bash
ollama pull llama3.2
ollama serve
```

Reinicie o assistente. Pronto — nada sai da sua máquina.

### Opção B — Groq grátis (nuvem, muito rápido)

1. Crie uma chave gratuita em https://console.groq.com/keys
2. Copie `.env.example` para `.env` e cole sua chave em `GROQ_API_KEY`

(O assistente usa Ollama quando disponível e cai para Groq automaticamente.)

## 🗂️ Estrutura

```
app/
  main.py      API FastAPI + regras do assistente
  ai.py        Provedores de IA com fallback + extração de compromissos/fatos
  voice.py     Cliente do Piper TTS (voz open-source local)
  db.py        SQLite: eventos, memórias e mensagens + análise de rotina
static/
  index.html   Interface de conversa e agenda
  app.js       Lógica do frontend
  style.css    Estilos
data/
  assistente.db  Seus dados (criado automaticamente)
```

## 🔊 Voz (open-source)

O assistente **fala as respostas em voz alta**. A prioridade é o **[Piper TTS](https://github.com/rhasspy/piper)** — open-source (MIT), rápido e 100% local, com voz em português:

```bash
pip install piper-tts
python3 -m piper.http_server -m pt_BR-faber-medium -p 5000
```

(No primeiro uso a voz `pt_BR-faber-medium` é baixada automaticamente — veja vozes em rhasspy/piper-samples ou HF `rhasspy/piper-voices`.)

Se o Piper não estiver rodando, o front faz **fallback automático** para a voz nativa gratuita do navegador (`speechSynthesis`, com voz pt-BR). Você também pode **falar com ele** pelo botão 🎤 (ditado nativo do navegador, grátis no Chrome/Edge), ou digitar.

## 🔒 Privacidade

Seus dados ficam no SQLite local (`data/assistente.db`). Com Ollama, nenhuma mensagem sai do seu computador. Com Groq, apenas o texto da mensagem vai para a API deles.
