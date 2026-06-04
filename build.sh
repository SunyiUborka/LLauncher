#!/usr/bin/env bash
set -euo pipefail
export NO_STRIP=true
exec npx tauri build "$@"
