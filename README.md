<div align="center">
  <img alt="Adner" src="assets/Adner_Horizontal_Logo.png" width="400">
  <p><i>Seu assistente pessoal de IA — fala com você, anota sua agenda, aprende sua rotina. 100% local e grátis.</i></p>
  <img src="https://img.shields.io/badge/python-%3E%3D3.11-blue" alt="Python">
  <img src="https://img.shields.io/badge/license-Apache%202.0-green" alt="License">
</div>

---

**Adner** é um assistente pessoal de IA que roda **no seu computador**, sem depender de servidor de ninguém. A inteligência fica com você: usa [Ollama](https://ollama.com/) (modelos locais gratuitos) e só chama a nuvem quando você desejar.

- 💬 Conversa em português por texto ou voz
- 📰 Briefing falado todo dia (e-mail, calendário, notícias) — `adner digest --fresh`
- 🧠 Memória pessoal e aprendizado com o seu dia a dia
- 🔍 Pesquisa profunda com citações e centenas de habilidades extensíveis
- 🔒 100% privado: por padrão, nada da sua conversa sai da sua máquina

> Adner é um fork do projeto **[OpenJarvis](https://github.com/open-jarvis/OpenJarvis)** (Apache-2.0, [Stanford](https://openjarvis.stanford.edu/)) renomeado para Adner — [licença](LICENSE) e [NOTICE](NOTICE) preservados.

## Instalação (1 comando)

Copie a linha da sua plataforma no **PowerShell** (Windows) ou no **Terminal** (Mac/Linux):

| Plataforma | Comando |
|---|---|
| **Windows** | baixe e execute [install-windows.ps1](deploy/windows/install.ps1) ou rode no PowerShell: `irm https://raw.githubusercontent.com/sistemrh/Adner/main/deploy/windows/install.ps1 | iex` |
| **macOS · Linux · WSL2** | `curl -fsSL https://raw.githubusercontent.com/sistemrh/Adner/main/scripts/install/install.sh | bash` |

O instalador cuida de tudo: Python, [uv](https://docs.astral.sh/uv/), Ollama e um modelo inicial (~3 minutos com banda larga). Depois:

```bash
adner            # conversar
adner gui        # interface gráfica no navegador
adner doctor     # diagnosticar a instalação
```

## Começo rápido

```bash
adner                                  # conversar no terminal
adner gui                              # conversar pela interface gráfica
adner init --preset morning-digest-mac --force   # briefing diário falado
adner connect gdrive                   # conectar Gmail / Calendar / Tasks
adner digest --fresh                   # gerar e tocar o primeiro resumo
```

Presets prontos: `morning-digest-*` (briefing falado de manhã), `deep-research` (pesquisa profunda com citações), `code-assistant`, `scheduled-monitor` e `chat-simple`.

## Habilidades e agentes

```bash
adner skill install hermes:arxiv        # instalar habilidades de catálogos públicos
adner agents                            # gerenciar agentes persistentes
adner agents create                     # criar seu próprio agente
```

Oito agentes integrados: resumo da manhã, pesquisa profunda, monitor contínuo, orquestrador, ReAct, agente autônomo persistente, CodeAct (programa e executa Python) e chat simples.

## Configuração

```bash
adner config set intelligence.default_model llama3.2   # modelo padrão
adner config edit                                       # abrir o arquivo de config
```

- Modelos locais gratuitos via Ollama (`ollama pull llama3.2`)
- Motores em nuvem opcionais (OpenAI, Anthropic, Groq etc.) — nunca obrigatórios
- Voz e síntese de fala configuráveis em `speech.*`

## Rodar a partir deste repositório

```bash
git clone https://github.com/sistemrh/Adner.git
cd Adner
uv sync --extra desktop --group desktop-native
uv run adner --help
```

> A extensão Rust opcional compila sozinha no `uv sync`.

## Sobre

Baseado no **OpenJarvis**, desenvolvido na [Hazy Research](https://hazyresearch.stanford.edu/) e no [Scaling Intelligence Lab](https://scalingintelligence.stanford.edu/) em [Stanford SAIL](https://ai.stanford.edu/). Todo o crédito da arquitetura original é dos autores listados em [NOTICE](NOTICE).

## Licença

[Apache 2.0](LICENSE)
