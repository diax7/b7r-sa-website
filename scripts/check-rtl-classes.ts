/**
 * RTL guardrail (BRD §8.8, constitution I and V).
 *
 * Scans `src/**` for physical-direction Tailwind utilities and CSS properties, which are
 * forbidden in an RTL-first codebase, and for raw hex colours inside components, which are
 * forbidden because every colour must come from a `@theme` token.
 *
 * A line containing `rtl-allow` is skipped (the WhatsApp widget's physical `right` placement
 * is the one sanctioned exception). Raw hex is allowed in `globals.css` (where the tokens are
 * defined) and in `content/products.ts` (colour swatches are data, not styling).
 *
 * Usage: `pnpm check:rtl` — exits 1 and prints `file:line` for every violation.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export interface Violation {
  file: string;
  line: number;
  rule: string;
  text: string;
}

// `ml-4`, `left-0` need a suffix; `rounded-l`, `border-r` are valid bare, so those may end there.
const PHYSICAL_CLASS =
  /(?<![\w-])(ml|mr|pl|pr|left|right)-|(?<![\w-])(rounded-[lr]|border-[lr])(-|(?![\w-]))/;
const PHYSICAL_TEXT = /(?<![\w-])text-(left|right)(?![\w-])/;
const PHYSICAL_FLOAT = /(?<![\w-])float-(left|right)(?![\w-])/;
const PHYSICAL_CSS =
  /(margin-left|margin-right|padding-left|padding-right|border-left|border-right|text-align\s*:\s*(left|right)|(?<![\w-])(left|right)\s*:)/;
const RAW_HEX = /#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])/;

const HEX_ALLOWED_FILES = new Set([
  'src/styles/globals.css',
  'src/app/(payload)/admin.css',
  'src/content/products.ts',
]);

export function checkLine(file: string, lineNumber: number, text: string): Violation[] {
  if (text.includes('rtl-allow')) return [];
  const out: Violation[] = [];
  const isCss = file.endsWith('.css');
  const classSource = isCss ? null : text;
  if (classSource !== null) {
    if (PHYSICAL_CLASS.test(classSource))
      out.push({ file, line: lineNumber, rule: 'physical-class', text });
    if (PHYSICAL_TEXT.test(classSource))
      out.push({ file, line: lineNumber, rule: 'physical-text-align', text });
    if (PHYSICAL_FLOAT.test(classSource))
      out.push({ file, line: lineNumber, rule: 'physical-float', text });
  }
  if (PHYSICAL_CSS.test(text)) out.push({ file, line: lineNumber, rule: 'physical-css', text });
  if (!HEX_ALLOWED_FILES.has(file) && file.endsWith('.tsx') && RAW_HEX.test(text)) {
    out.push({ file, line: lineNumber, rule: 'raw-hex', text });
  }
  return out;
}

export function checkSource(file: string, source: string): Violation[] {
  return source.split(/\r?\n/).flatMap((text, i) => checkLine(file, i + 1, text));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(full);
  }
  return out;
}

export function checkDirectory(root: string, srcDir = 'src'): Violation[] {
  const base = join(root, srcDir);
  return walk(base).flatMap((full) => {
    const file = relative(root, full).split(sep).join('/');
    return checkSource(file, readFileSync(full, 'utf8'));
  });
}

const isMain = process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/check-rtl-classes.ts');
if (isMain) {
  const violations = checkDirectory(process.cwd());
  if (violations.length === 0) {
    console.log('check:rtl — no physical-direction classes or raw hex found.');
  } else {
    for (const v of violations) console.error(`${v.file}:${v.line}  [${v.rule}]  ${v.text.trim()}`);
    console.error(
      `\ncheck:rtl — ${violations.length} violation(s). Use logical utilities (ms- me- ps- pe- start- end- text-start text-end) and @theme tokens.`,
    );
    process.exit(1);
  }
}
