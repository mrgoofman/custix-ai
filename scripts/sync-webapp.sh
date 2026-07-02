#!/usr/bin/env bash
# Sync the built web app (custix repo, frontend/dist-web) into public/app.
set -euo pipefail
SRC="${1:-/Users/lorenzkutschka/Documents/repos/custix/frontend/dist-web}"
DST="$(dirname "$0")/../public/app"
[ -f "$SRC/index.html" ] || { echo "no build at $SRC — run 'pnpm build:web' in custix/frontend"; exit 1; }
rm -rf "$DST"
mkdir -p "$DST"
cp -R "$SRC/." "$DST/"
# ort loads its runtime wasm from /models/ort/ (R2) at runtime; bundled copies
# above the 25 MiB Workers asset cap are never fetched - drop them.
find "$DST" -type f -name "*.wasm" -size +24M -delete
echo "synced $(du -sh "$DST" | cut -f1) -> public/app"
