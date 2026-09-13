#!/usr/bin/env bash
# Database backup (BRD 9.8, ADR-034): `pg_dump` in custom format, uploaded to the PRIVATE
# backup bucket — never the public media bucket. Needs DATABASE_URL and the BACKUP_S3_* rows
# (endpoint and region fall back to the media bucket's). Retention is a lifecycle rule on
# the bucket (docs/RUNBOOK.md, "Backups and restore").
#
#   bash scripts/backup.sh            # → s3://$BACKUP_S3_BUCKET/YYYY-MM-DD.dump
#   bash scripts/backup.sh ./out.dump # keep a local copy as well
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required}"
: "${BACKUP_S3_ACCESS_KEY_ID:?BACKUP_S3_ACCESS_KEY_ID is required}"
: "${BACKUP_S3_SECRET_ACCESS_KEY:?BACKUP_S3_SECRET_ACCESS_KEY is required}"
endpoint="${BACKUP_S3_ENDPOINT:-${S3_ENDPOINT:?BACKUP_S3_ENDPOINT or S3_ENDPOINT is required}}"
region="${BACKUP_S3_REGION:-${S3_REGION:-auto}}"

if [ "$BACKUP_S3_BUCKET" = "${S3_BUCKET:-}" ]; then
  echo "backup: BACKUP_S3_BUCKET must not be the public media bucket ($S3_BUCKET)" >&2
  exit 1
fi

stamp="$(date -u +%Y-%m-%d)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
file="$tmp/$stamp.dump"

pg_dump --format=custom --no-owner --no-privileges --file "$file" "$DATABASE_URL"
size=$(wc -c < "$file")
[ "$size" -gt 1024 ] || { echo "backup: dump is only $size bytes" >&2; exit 1; }

AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_ACCESS_KEY" \
  AWS_EC2_METADATA_DISABLED=true aws --endpoint-url "$endpoint" --region "$region" \
  s3 cp "$file" "s3://$BACKUP_S3_BUCKET/$stamp.dump" --only-show-errors

[ "${1:-}" ] && cp "$file" "$1"
echo "backup: $stamp.dump ($size bytes) → s3://$BACKUP_S3_BUCKET"
