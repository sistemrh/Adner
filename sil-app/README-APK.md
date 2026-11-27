# App Android da Tiz

O APK da Tiz é compilado automaticamente pelo GitHub Actions — **não precisa de computador nem do Android Studio**.

## Como baixar o APK (direto no celular)

Abra este link no navegador do celular e o download começa:

**https://sistemrh.github.io/Adner/download/sil.apk**

Depois de baixar, toque na notificação de download (ou abra a pasta Downloads) e toque no arquivo para instalar — autorize a "fonte desconhecida".

## Primeira configuração no celular (uma vez)

1. Abra o app **Tiz**
2. Ele vai abrir a tela **Acesso às notificações** → autorize o app **Tiz** (é o que permite ouvir as notificações do WhatsApp)
3. O Android também vai pedir **permissão de microfone** → autorize (é a sua voz)
4. Pronto: cada mensagem do WhatsApp vai para o Supabase automaticamente, mesmo com o app fechado

## Como funciona

- O app é uma "casca" nativa ao redor do site da Tiz: a interface e a inteligência são as mesmas, e atualizações no site valem para o app na hora (sem reinstalar nada)
- Um serviço Android (`NotificationListenerService`) captura notificações do `com.whatsapp` e `com.whatsapp.w4b` (WhatsApp e WhatsApp Business) e grava no Supabase, na tabela `messages`
- No site, a Tiz tem a ferramenta `get_messages`: "Tiz, quem me mandou mensagem?"

## Compilar de novo

Toda alteração na pasta `sil-app/` dispara o build automaticamente. Para forçar: GitHub → **Actions** → **Build APK** → **Run workflow**.

## Requisitos técnicos

- Capacitor 7 + `@capacitor-community/speech-recognition` 7 (reconhecimento de voz nativo, pois o WebView não tem o Web Speech API)
- Plugin nativo próprio em `android-overrides/`
- Java 21 no CI
