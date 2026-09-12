#!/usr/bin/env bash
# Subsets the licensed ITF Rayat Round woff2 files to the scripts the site renders (Arabic,
# Basic Latin, Latin-1 punctuation, general punctuation) and writes them to public/fonts.
# Requires uv (uses fonttools + brotli through uvx). Run after resources/brand/fonts changes.
set -euo pipefail
cd "$(dirname "$0")/.."
UNICODES="U+0020-007E,U+00A0-00BF,U+00D7,U+00F7,U+0600-06FF,U+0750-077F,U+2000-206F,U+20AC,U+2212,U+FDFC"
mkdir -p public/fonts
for w in Light Regular Medium Bold Black; do
  uvx --from fonttools --with brotli pyftsubset "resources/brand/fonts/web/ITFRayatRound-${w}.woff2" \
    --unicodes="$UNICODES" --layout-features='*' --flavor=woff2 --no-hinting --desubroutinize \
    --output-file="public/fonts/ITFRayatRound-${w}.woff2"
  printf '%-8s %6d bytes\n' "$w" "$(wc -c < "public/fonts/ITFRayatRound-${w}.woff2")"
done
