---
title: Downloads
description: Download the Adner desktop app, browser app, CLI, or Python SDK
---

# Downloads

Adner runs entirely on your hardware. Choose the interface that fits your workflow.

---

## Desktop App

The desktop app is a native window for the Adner chat UI. All inference and backend
processing happens on your local machine — the app connects to the backend you start locally.

!!! info "Backend required"
    Start the backend before opening the desktop app. The quickstart script handles everything:
    ```bash
    git clone https://github.com/open-jarvis/OpenJarvis.git && cd Adner
    ./scripts/quickstart.sh
    ```

### Download

| Platform | Download | Notes |
|----------|----------|-------|
| macOS (Universal) | [:material-download: **Adner.dmg**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_universal.dmg) | Apple Silicon + Intel |
| Windows (x64) | [:material-download: **Adner-setup.exe**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_x64-setup.exe) | Windows 10+ |
| Windows (ARM64) | [:material-download: **Adner-arm64-setup.exe**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_arm64-setup.exe) | Windows 11 on ARM |
| Linux (DEB) | [:material-download: **Adner.deb**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_amd64.deb) | Ubuntu, Debian |
| Linux (RPM) | [:material-download: **Adner.rpm**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_x86_64.rpm) | Fedora, RHEL |
| Linux (AppImage) | [:material-download: **Adner.AppImage**](https://github.com/open-jarvis/OpenJarvis/releases/latest/download/Adner_amd64.AppImage) | Any distro |

!!! tip "All releases"
    Browse all versions on the [GitHub Releases](https://github.com/open-jarvis/OpenJarvis/releases) page.

### macOS: "app is damaged" fix

macOS Gatekeeper quarantines apps downloaded from the internet that aren't notarized
by Apple. If you see **"Adner is damaged and can't be opened"**, run this in
Terminal to clear the quarantine flag:

```bash
xattr -cr /Applications/Adner.app
```

Then open the app normally. If you installed from the DMG but haven't moved it to
`/Applications` yet, point the command at wherever the `.app` bundle is:

```bash
xattr -cr ~/Downloads/Adner.app
```

!!! note
    This is standard for open-source macOS apps distributed outside the App Store.
    The command removes the quarantine extended attribute — it does not modify the app.

### What's included

The desktop app provides:

- **Full chat UI** — same interface as the browser app, in a native window
- **Energy monitoring** — real-time power consumption tracking
- **Telemetry dashboard** — token throughput, latency, and cost comparison vs. cloud models
- **System tray** — quick access without keeping a terminal open

The backend (Ollama, Python API server, inference) runs separately on your machine.

### Build from source

```bash
git clone https://github.com/open-jarvis/OpenJarvis.git
cd Adner/desktop
npm install
npm run tauri build
```

The built installer will be in `frontend/src-tauri/target/release/bundle/`.

---

## Browser App

Run the full chat UI in your browser. Everything stays local — the backend runs on
your machine and the frontend connects via `localhost`.

### One-command setup

```bash
git clone https://github.com/open-jarvis/OpenJarvis.git
cd Adner
./scripts/quickstart.sh
```

The script handles everything:

1. Checks for Python 3.10–3.13 and Node.js 18+
2. Installs Ollama if not present and pulls a starter model
3. Installs Python and frontend dependencies
4. Starts the backend API server and frontend dev server
5. Opens `http://localhost:5173` in your browser

### Manual setup

If you prefer to run each step yourself:

=== "Step 1: Clone and install"

    ```bash
    git clone https://github.com/open-jarvis/OpenJarvis.git
    cd Adner
    uv sync --extra desktop
    cd frontend && npm install && cd ..
    ```

=== "Step 2: Start Ollama"

    ```bash
    # Install from https://ollama.com if not already installed
    ollama serve &
    ollama pull qwen3:0.6b
    ```

=== "Step 3: Start backend"

    ```bash
    uv run adner serve --port 8000
    ```

=== "Step 4: Start frontend"

    ```bash
    cd frontend
    npm run dev
    ```

Then open [http://localhost:5173](http://localhost:5173).

### What you get

- **Chat interface** — markdown rendering, streaming responses, conversation history
- **Tool use** — calculator, web search, code interpreter, file I/O
- **System panel** — live telemetry, energy monitoring, cost comparison vs. cloud models
- **Dashboard** — energy graphs, trace debugging, cost breakdown
- **Settings** — model selection, agent configuration, theme toggle

---

## CLI

The command-line interface is the fastest way to interact with Adner
programmatically. Every feature is accessible from the terminal.

### Install

```bash
git clone https://github.com/open-jarvis/OpenJarvis.git
cd Adner
uv sync
```

### Verify

```bash
adner --version
# adner, version 0.1.0
```

### First commands

```bash
# Ask a question
adner ask "What is the capital of France?"

# Use an agent with tools
adner ask --agent orchestrator --tools calculator "What is 137 * 42?"

# Start the API server
adner serve --port 8000

# Run diagnostics
adner doctor

# List available models
adner model list

# Interactive chat
adner chat
```

!!! info "Inference backend required"
    The CLI requires a running inference backend (e.g., Ollama). See the
    [Installation guide](getting-started/installation.md#setting-up-an-inference-backend)
    for setup instructions.

---

## Python SDK

For programmatic access, the `Adner` class provides a high-level sync API.

### Install

```bash
git clone https://github.com/open-jarvis/OpenJarvis.git
cd Adner
uv sync
```

### Quick example

```python
from adner import Adner

j = Adner()
print(j.ask("Explain quicksort in two sentences."))
j.close()
```

### With agents and tools

```python
result = j.ask_full(
    "What is the square root of 144?",
    agent="orchestrator",
    tools=["calculator", "think"],
)
print(result["content"])       # "12"
print(result["tool_results"])  # tool invocations
print(result["turns"])         # number of agent turns
```

### Composition layer

For full control, use the `SystemBuilder`:

```python
from adner import SystemBuilder

system = (
    SystemBuilder()
    .engine("ollama")
    .model("qwen3:8b")
    .agent("orchestrator")
    .tools(["calculator", "web_search", "file_read"])
    .enable_telemetry()
    .enable_traces()
    .build()
)

result = system.ask("Summarize the latest AI news.")
system.close()
```

See the [Python SDK guide](user-guide/python-sdk.md) for the full API reference.
