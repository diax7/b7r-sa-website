#!/usr/bin/env bash
# One-off for the review database (PR 4b, phase 2): the three booking migrations applied
# there under their first names become the two re-based ones (the same schema, renamed
# rows), and what the re-based migration adds on top of that schema is applied by hand:
# the Meet request id column, the two calendar kinds and the sweep's job slug on the enums.
# Reads DATABASE_URL from .env.local; prints it masked; never prints a secret.
set -euo pipefail
ENV_FILE="${1:-.env.local}"
URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r')
echo "database: $(printf '%s' "$URL" | sed -E 's#(://[^:]+:)[^@]+@#\1***@#')"

# psql on the host, or the compose container's (`docker exec`) when the host has none.
if command -v psql > /dev/null 2>&1; then
  PSQL=(psql "$URL")
else
  CONTAINER="${PG_CONTAINER:-opustry-db-1}"
  DB=$(printf '%s' "$URL" | sed -E 's#.*/([^/?]+)(\?.*)?$#\1#')
  USER=$(printf '%s' "$URL" | sed -E 's#^[a-z]+://([^:/]+):.*#\1#')
  PSQL=(docker exec "$CONTAINER" psql -U "$USER" -d "$DB")
  echo "psql: through docker exec $CONTAINER as $USER on $DB"
fi
run() { "${PSQL[@]}" -v ON_ERROR_STOP=1 -q -c "$1"; }

run "UPDATE payload_migrations SET name = '20260919_195745_bookings', batch = 35 WHERE name = '20260919_170643_booking_global';"
run "DELETE FROM payload_migrations WHERE name = '20260919_173150_bookings';"
run "UPDATE payload_migrations SET name = '20260919_195800_bookings_start_active', batch = 35 WHERE name = '20260919_173200_bookings_start_active';"
run "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meet_request_id varchar;"
run "ALTER TYPE enum_connections_kind ADD VALUE IF NOT EXISTS 'google-calendar';"
run "ALTER TYPE enum_connections_kind ADD VALUE IF NOT EXISTS 'mock-calendar';"
run "ALTER TYPE enum_payload_jobs_log_task_slug ADD VALUE IF NOT EXISTS 'bookings-sweep' BEFORE 'schedulePublish';"
run "ALTER TYPE enum_payload_jobs_task_slug ADD VALUE IF NOT EXISTS 'bookings-sweep' BEFORE 'schedulePublish';"
"${PSQL[@]}" -q -c "SELECT id, name, batch FROM payload_migrations ORDER BY id DESC LIMIT 4;"
