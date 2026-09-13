#!/usr/bin/env bash
# Restore rehearsal (BRD 9.8, ADR-034): dump the seeded CI database the way scripts/backup.sh
# does, restore it into a scratch database, and count the documents. Needs DATABASE_URL to a
# database that has been migrated and seeded, and pg_dump/pg_restore/psql on the PATH.
set -euo pipefail
cd "$(dirname "$0")/../.."

: "${DATABASE_URL:?DATABASE_URL is required}"
scratch="b7r_restore"
admin_url="${DATABASE_URL%/*}/postgres"
scratch_url="${DATABASE_URL%/*}/$scratch"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

pg_dump --format=custom --no-owner --no-privileges --file "$tmp/backup.dump" "$DATABASE_URL"
psql "$admin_url" -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS $scratch;" -c "CREATE DATABASE $scratch;"
pg_restore --no-owner --no-privileges --dbname "$scratch_url" "$tmp/backup.dump"

count() { psql "$scratch_url" -tA -c "select count(*) from $1"; }
products=$(count products)
pages=$(count pages)
faqs=$(count faqs)
media=$(count media)
echo "restore-check: products=$products pages=$pages faqs=$faqs media=$media"
[ "$products" -ge 5 ] && [ "$pages" -ge 7 ] && [ "$faqs" -ge 16 ] && [ "$media" -gt 0 ] || {
  echo "restore-check: counts below the seed" >&2
  exit 1
}
psql "$admin_url" -q -c "DROP DATABASE $scratch;"
echo "restore-check: ok"
