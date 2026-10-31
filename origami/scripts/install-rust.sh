#!/usr/bin/env bash
# Vercel's build image has no Rust. Install a minimal stable toolchain with the wasm target.
set -euo pipefail
if ! command -v "$HOME/.cargo/bin/cargo" >/dev/null 2>&1 && ! command -v cargo >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable
fi
export PATH="$HOME/.cargo/bin:$PATH"
rustup target add wasm32-unknown-unknown
