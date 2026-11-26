# Edi — Assistente Pessoal de Voz

Assistente de voz estilo Jarvis, 100% estático (sem backend), hospedado no GitHub Pages.

**Acesse:** https://sistemrh.github.io/Adner/edi/

## Como funciona

- **Ouve:** Web Speech API (`SpeechRecognition`) do navegador, em português (pt-BR).
- **Pensa:** Groq API com o modelo `llama-3.3-70b-versatile` (chave embutida no código, conforme solicitado).
- **Fala:** síntese de voz nativa (`speechSynthesis`).
- **Modo contínuo:** ative a opção e diga **"Edi"** para chamá-la sem tocar na tela.

## Como usar

1. Abra a URL acima no **Chrome, Edge ou Safari** (Firefox não suporta reconhecimento de voz).
2. Autorize o microfone quando o navegador pedir.
3. Toque no núcleo azul e fale, ou digite no campo de texto.
4. Com a escuta contínua ligada, diga "Edi, que horas são?".

## ⚠️ Aviso de segurança

A chave da API Groq está **embutida no código-fonte** e este site é **público** — qualquer pessoa pode ver a chave e consumir sua cota da Groq. Para uso pessoal/demonstração isso funciona, mas se a cota for abusada, revogue a chave em https://console.groq.com/keys e gere outra.
