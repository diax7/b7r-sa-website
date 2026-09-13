import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * No em dashes anywhere (Dhia, 2026-09-13; `.claude/rules/writing.md`): not in site copy,
 * SEO, admin strings, e-mails, comments, docs or specs. Arabic takes «،» or a colon, English
 * a comma, a colon or a new sentence. Scans every authored text file; third-party and
 * generated files are skipped.
 */
const EM_DASH = String.fromCharCode(0x2014);

const ROOTS = ['src', 'e2e', 'tests', 'scripts', 'docs', 'specs', '.claude', '.github'];
const ROOT_FILES = ['README.md', 'CLAUDE.md', 'B7R-WEBSITE-MASTER-BRD.md'];
const SKIP_DIRS = new Set(['node_modules', '.next', 'dist', 'migrations']);
const TEXT = /\.(tsx?|css|md|json|ya?ml|sh)$/;

export interface Violation {
  file: string;
  line: number;
  text: string;
}

export function checkSource(file: string, source: string): Violation[] {
  return source
    .split(/\r?\n/)
    .flatMap((text, i) => (text.includes(EM_DASH) ? [{ file, line: i + 1, text }] : []));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT.test(entry)) out.push(full);
  }
  return out;
}

export function checkRepository(root: string): Violation[] {
  const files = ROOTS.flatMap((r) => {
    try {
      return walk(join(root, r));
    } catch {
      return [];
    }
  });
  for (const f of ROOT_FILES) {
    try {
      statSync(join(root, f));
      files.push(join(root, f));
    } catch {
      // absent
    }
  }
  return files.flatMap((full) => {
    const file = relative(root, full).split(sep).join('/');
    return checkSource(file, readFileSync(full, 'utf8'));
  });
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-em-dash.ts');
if (isMain) {
  const violations = checkRepository(process.cwd());
  if (violations.length === 0) {
    console.log('check:dash: no em dashes.');
  } else {
    for (const v of violations) console.error(`${v.file}:${v.line}  ${v.text.trim()}`);
    console.error(
      `\ncheck:dash: ${violations.length} em dash(es). Use «،», a comma, a colon or a new sentence (.claude/rules/writing.md).`,
    );
    process.exit(1);
  }
}
