#!/usr/bin/env bash
# Bundles the Hono app + Cosmos adapter into function/dist (index.js, host.json, package.json) and zips it.
# No Azure access needed. Output: function/dist/function.zip
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$HERE/../.."
OUT="$HERE/function/dist"

rm -rf "$OUT" && mkdir -p "$OUT/pkg"
(cd "$ROOT" && bunx esbuild src/entrypoints/azure-function.ts \
  --bundle --platform=node --target=node20 --format=cjs \
  --external:@azure/functions-core \
  --outfile="$OUT/pkg/index.js" --log-level=warning)
cp "$HERE/function/host.json" "$HERE/function/package.json" "$OUT/pkg/"
(cd "$OUT/pkg" && zip -qr ../function.zip .)
echo "Built $OUT/function.zip ($(du -h "$OUT/function.zip" | cut -f1))"
