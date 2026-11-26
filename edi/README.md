# Edi — Assistente Pessoal de Voz

Assistente de voz estilo Jarvis, 100% estático (sem backend), hospedado no GitHub Pages.

**Acesse:** https://sistemrh.github.io/Adner/edi/

## Como funciona

- **Ouve:** Web Speech API (`SpeechRecognition`) do navegador, em português (pt-BR).
- **Pensa:** Groq API com o modelo `openai/gpt-oss-120b` (chave embutida no código, conforme solicitado).
- **Fala:** voz masculina natural "Caio" via Speechify API (chave embutida no código, conforme solicitado), com fallback para a síntese de voz do navegador.
- **Modo contínuo:** ative a opção e diga **"Edi"** para chamá-la sem tocar na tela.

## Como usar

1. Abra a URL acima no **Chrome, Edge ou Safari** (Firefox não suporta reconhecimento de voz).
2. Autorize o microfone quando o navegador pedir.
3. Toque no núcleo azul e fale, ou digite no campo de texto.
4. Com a escuta contínua ligada, diga "Edi, que horas são?".

## ⚠️ Aviso de segurança

As chaves da API (Groq e Speechify) estão **embutidas no código-fonte** e este site é **público** — qualquer pessoa pode vê-las e consumir as cotas. Revogue-as se notar uso anômalo:

- Groq: https://console.groq.com/keys
- Speechify: https://platform.speechify.ai/api-keys
