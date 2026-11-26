#!/usr/bin/env bash
# adner-wrapper.sh — symlinked to ~/.local/bin/adner.
# Activates the managed venv and execs the real adner CLI.

ADNER_HOME="${ADNER_HOME:-$HOME/.adner}"
VENV="$ADNER_HOME/.venv"

if [[ ! -d "$VENV" ]]; then
    echo "adner: venv not found at $VENV" >&2
    echo "Re-run the installer: curl -fsSL https://raw.githubusercontent.com/sistemrh/Adner/main/scripts/install/install.sh | bash" >&2
    exit 1
fi

exec "$VENV/bin/adner" "$@"
