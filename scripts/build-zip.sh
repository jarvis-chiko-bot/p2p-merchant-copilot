#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(python3 -c 'import json; print(json.load(open("manifest.json"))["version"])')
NAME="p2p-merchant-copilot-v${VERSION}"

mkdir -p dist
OUT="dist/${NAME}.zip"

# zip the extension source (root contains manifest.json)
# Exclude git + dist + OS junk
rm -f "$OUT"
zip -r "$OUT" . \
  -x ".git/*" \
  -x ".gitignore" \
  -x "dist/*" \
  -x "*.DS_Store" \
  -x "scripts/*" \
  >/dev/null

echo "Created: $OUT"
