#!/usr/bin/env bats

setup() {
    TEST_TMPDIR=$(mktemp -d)
    export ADNER_HOME="$TEST_TMPDIR/.adner"
    mkdir -p "$ADNER_HOME/.state"
    mkdir -p "$ADNER_HOME/src/rust/crates/adner-python"
    touch "$ADNER_HOME/src/rust/crates/adner-python/Cargo.toml"
    export UV_STUB_LOG="$TEST_TMPDIR/uv.log"
    : > "$UV_STUB_LOG"
    export PYTHON_STUB_LOG="$TEST_TMPDIR/python.log"
    : > "$PYTHON_STUB_LOG"
    mkdir -p "$ADNER_HOME/.venv/bin"
    cat > "$ADNER_HOME/.venv/bin/python" <<'EOF'
#!/usr/bin/env bash
echo "$0 $*" >> "$PYTHON_STUB_LOG"
exit "${PYTHON_STUB_EXIT:-0}"
EOF
    chmod +x "$ADNER_HOME/.venv/bin/python"
    # A function takes precedence over the script's self-healed PATH, even
    # on developer machines with a real uvx in ~/.local/bin.
    export UVX_STUB="$BATS_TEST_DIRNAME/stubs/uvx"
    uvx() { "$UVX_STUB" "$@"; }
    export -f uvx
    export PATH="$BATS_TEST_DIRNAME/stubs:$PATH"
    export SCRIPT="$BATS_TEST_DIRNAME/../../../scripts/install/build-extension.sh"
}

teardown() {
    [[ -n "${TEST_TMPDIR:-}" ]] && rm -rf "$TEST_TMPDIR"
}

@test "writes extension-built marker on success" {
    UV_STUB_EXIT=0 run bash "$SCRIPT"
    [ "$status" -eq 0 ]
    [ -f "$ADNER_HOME/.state/extension-built" ]
}

@test "writes extension-failed marker on failure" {
    UV_STUB_EXIT=1 run bash "$SCRIPT"
    [ "$status" -ne 0 ]
    [ -f "$ADNER_HOME/.state/extension-failed" ]
    [ -s "$ADNER_HOME/.state/extension-failed" ]
}

@test "removes prior failed marker on success" {
    touch "$ADNER_HOME/.state/extension-failed"
    UV_STUB_EXIT=0 run bash "$SCRIPT"
    [ ! -f "$ADNER_HOME/.state/extension-failed" ]
    [ -f "$ADNER_HOME/.state/extension-built" ]
}

@test "builds and verifies the extension in the runtime venv" {
    UV_STUB_EXIT=0 run bash "$SCRIPT"
    [ "$status" -eq 0 ]
    grep -Fx "VIRTUAL_ENV=$ADNER_HOME/.venv" "$UV_STUB_LOG"
    grep -Fx "maturin develop --uv -m $ADNER_HOME/src/rust/crates/adner-python/Cargo.toml" "$UV_STUB_LOG"
    grep -Fx "$ADNER_HOME/.venv/bin/python -c import adner_rust" "$PYTHON_STUB_LOG"
    [ ! -d "$ADNER_HOME/src/.venv" ]
}

@test "reports a failed runtime import and preserves its exit code" {
    touch "$ADNER_HOME/.state/extension-built"
    PYTHON_STUB_EXIT=7 run bash "$SCRIPT"
    [ "$status" -eq 7 ]
    [ ! -f "$ADNER_HOME/.state/extension-built" ]
    grep -q "failed in the serving venv ($ADNER_HOME/.venv)" "$ADNER_HOME/.state/extension-failed"
    grep -q 'exit=7' "$ADNER_HOME/.state/extension-failed"
}

@test "fails before compilation when the runtime venv is missing" {
    touch "$ADNER_HOME/.state/extension-built"
    rm -f "$ADNER_HOME/.venv/bin/python"
    run bash "$SCRIPT"
    [ "$status" -ne 0 ]
    [ ! -s "$UV_STUB_LOG" ]
    [ ! -f "$ADNER_HOME/.state/extension-built" ]
    grep -q "runtime venv not found" "$ADNER_HOME/.state/extension-failed"
}

@test "fails before compilation when the manifest is missing" {
    touch "$ADNER_HOME/.state/extension-built"
    rm -f "$ADNER_HOME/src/rust/crates/adner-python/Cargo.toml"
    run bash "$SCRIPT"
    [ "$status" -ne 0 ]
    [ ! -s "$UV_STUB_LOG" ]
    [ ! -f "$ADNER_HOME/.state/extension-built" ]
    grep -q "manifest not found" "$ADNER_HOME/.state/extension-failed"
}

@test "atomic rename — no .tmp file left behind" {
    UV_STUB_EXIT=0 run bash "$SCRIPT"
    leftover=$(find "$ADNER_HOME/.state" -name "*.tmp" 2>/dev/null | wc -l)
    [ "$leftover" -eq 0 ]
}
