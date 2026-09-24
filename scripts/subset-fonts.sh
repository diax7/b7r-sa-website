#!/usr/bin/env bash
# Subsets the curated typefaces (spec 010, `src/modules/brand/typefaces.ts`) to the scripts the
# site renders (Arabic, Basic Latin, Latin-1 punctuation, general punctuation) and to the
# OpenType features the site uses (Arabic shaping, ligatures, marks, kerning; the stylistic
# sets and discretionary ligatures are never enabled). Writes public/fonts. Requires uv
# (fonttools + brotli via uvx). Run after resources/brand/fonts changes, for every family or
# for the ones named: `bash scripts/subset-fonts.sh tajawal`.
#
# ITF Rayat Round is licensed to B7R for b7r.sa only (BRD 3.2); the other three are under the
# SIL Open Font License: their subsets keep every name record (the licence and its URL among
# them) and the licence text is copied beside the served files, as the OFL asks of a
# redistributed font.
set -euo pipefail
cd "$(dirname "$0")/.."
UNICODES="U+0020-007E,U+00A0-00BF,U+00D7,U+00F7,U+0600-06FF,U+0750-077F,U+2000-206F,U+20AC,U+2212,U+FDFC"
FEATURES="init,medi,fina,isol,rlig,liga,calt,ccmp,locl,mark,mkmk,kern"
mkdir -p public/fonts

subset() {
  local source="$1" output="$2"
  shift 2
  uvx --from fonttools --with brotli pyftsubset "$source" \
    --unicodes="$UNICODES" --layout-features="$FEATURES" --flavor=woff2 --no-hinting \
    --output-file="public/fonts/$output" "$@"
  printf '%-40s %6d bytes\n' "$output" "$(wc -c <"public/fonts/$output")"
}

# An open family's licence, beside its files.
open_licence() {
  cp "resources/brand/fonts/$1/OFL.txt" "public/fonts/$2-OFL.txt"
}

rayat() {
  for w in Light Regular Medium Bold Black; do
    subset "resources/brand/fonts/web/ITFRayatRound-${w}.woff2" "ITFRayatRound-${w}.woff2"
  done
}

# One variable file covers 400 to 800; the browser picks the nearest weight for the rest.
baloo() {
  subset "resources/brand/fonts/baloo-bhaijaan-2/BalooBhaijaan2[wght].ttf" \
    "BalooBhaijaan2-Variable.woff2" --name-IDs='*'
  open_licence baloo-bhaijaan-2 BalooBhaijaan2
}

plex() {
  for w in Light Regular Medium Bold; do
    subset "resources/brand/fonts/ibm-plex-sans-arabic/IBMPlexSansArabic-${w}.ttf" \
      "IBMPlexSansArabic-${w}.woff2" --name-IDs='*'
  done
  open_licence ibm-plex-sans-arabic IBMPlexSansArabic
}

tajawal() {
  for w in Light Regular Medium Bold Black; do
    subset "resources/brand/fonts/tajawal/Tajawal-${w}.ttf" "Tajawal-${w}.woff2" --name-IDs='*'
  done
  open_licence tajawal Tajawal
}

families=("$@")
[ ${#families[@]} -eq 0 ] && families=(rayat baloo plex tajawal)
for family in "${families[@]}"; do
  case "$family" in
    rayat | baloo | plex | tajawal) "$family" ;;
    *)
      echo "subset-fonts: unknown family '$family' (rayat, baloo, plex, tajawal)" >&2
      exit 1
      ;;
  esac
done
