/**
 * Normalises Payload-generated migrations for this repo's TypeScript settings: type-only
 * imports (verbatimModuleSyntax) and no unused parameters. Runs after `payload migrate:create`
 * (`pnpm migrate:create <name>`); idempotent.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), 'src', 'migrations');
let touched = 0;
for (const file of readdirSync(dir)) {
  if (!/^\d{8}_\d{6}_.+\.ts$/.test(file)) continue;
  const path = join(dir, file);
  const before = readFileSync(path, 'utf8');
  const after = before
    .replace(
      "import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'",
      "import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres';",
    )
    .replaceAll('{ db, payload, req }', '{ db }');
  if (after !== before) {
    writeFileSync(path, after);
    touched++;
  }
}
console.warn(`fix-migrations: ${touched} file(s) normalised.`);
