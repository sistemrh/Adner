# Sil — Assistente de Voz

Assistente de voz estilo Jarvis, 100% estático (sem backend), hospedado no GitHub Pages.

**Acesse:** https://sistemrh.github.io/Adner/edi/

## Como funciona

- **Ouve:** Web Speech API (`SpeechRecognition`) do navegador, em português (pt-BR).
- **Pensa:** Groq API com o modelo `openai/gpt-oss-120b` (chave embutida no código, conforme solicitado).
- **Sabe data e hora:** injetadas no contexto a cada mensagem (horário de Brasília).
- **Previsão do tempo:** função `get_weather` via Open-Meteo (gratuita, sem chave) — tempo atual, hoje e amanhã de qualquer cidade.
- **Fala:** voz masculina natural "Caio" via Speechify API (chave embutida no código, conforme solicitado), com fallback para a síntese de voz do navegador.
- **Modo contínuo:** ative a opção e diga **"Sil"** para chamá-la sem tocar na tela.
- **Memória de longo prazo:** banco **Supabase** (tabela `memories`). "Tome nota..." grava, "esqueça..." apaga. Se o Supabase estiver indisponível, usa o cache local do navegador.

## Backend (Supabase)

O navegador usa apenas a chave **publishable** (segura para clientes), protegida por RLS. Para recriar o banco:

```sql
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  em timestamptz not null default now()
);
alter table memories enable row level security;
create policy "anon read" on memories for select using (true);
create policy "anon insert" on memories for insert with check (true);
create policy "anon delete" on memories for delete using (true);
```

Dados pessoais (família, rotinas) foram **removidos do código público** e vivem apenas no banco Supabase.

## Como usar

1. Abra a URL acima no **Chrome, Edge ou Safari** (Firefox não suporta reconhecimento de voz).
2. Autorize o microfone quando o navegador pedir.
3. Toque no núcleo azul e fale, ou digite no campo de texto.
4. Com a escuta contínua ligada, diga "Sil, que horas são?" ou "Sil, como está o tempo em São Paulo?".

## ⚠️ Aviso de segurança

As chaves da API (Groq e Speechify) estão **embutidas no código-fonte** e este site é **público** — qualquer pessoa pode vê-las e consumir as cotas. Revogue-as se notar uso anômalo:

- Groq: https://console.groq.com/keys
- Speechify: https://platform.speechify.ai/api-keys
