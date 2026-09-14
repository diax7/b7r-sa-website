import { isLocale, type Locale } from '@/lib/i18n';

/**
 * Bulk add from CSV (BRD 10.2.7):
 * `title,hub,primaryKeyword,secondaryKeywords,intent,priority,language` with a header row;
 * secondary keywords separated by `;`; `language` is `ar` (the default) or `en` (ADR-043).
 * Pure parsing; the route resolves hubs by slug and creates the rows.
 */
export interface TopicRow {
  title: string;
  hub: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: 'informational' | 'commercial' | 'seasonal';
  priority: number;
  language: Locale;
}

export interface ParsedCsv {
  rows: TopicRow[];
  errors: string[];
}

const INTENTS = new Set(['informational', 'commercial', 'seasonal']);

/** One CSV line into fields: quoted fields may hold commas; `""` is a quote. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(field);
      field = '';
    } else field += ch;
  }
  out.push(field);
  return out.map((f) => f.trim());
}

export function parseTopicsCsv(text: string): ParsedCsv {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const rows: TopicRow[] = [];
  const errors: string[] = [];
  const header = lines[0] ? splitCsvLine(lines[0]).map((h) => h.toLowerCase()) : [];
  const hasHeader = header.includes('title') && header.includes('hub');
  const body = hasHeader ? lines.slice(1) : lines;
  const col = (name: string, fallback: number) => {
    const i = header.indexOf(name.toLowerCase());
    return hasHeader && i >= 0 ? i : fallback;
  };
  const at = {
    title: col('title', 0),
    hub: col('hub', 1),
    keyword: col('primaryKeyword', 2),
    secondary: col('secondaryKeywords', 3),
    intent: col('intent', 4),
    priority: col('priority', 5),
    language: col('language', 6),
  };
  body.forEach((line, index) => {
    const n = index + (hasHeader ? 2 : 1);
    const f = splitCsvLine(line);
    const title = f[at.title] ?? '';
    const hub = f[at.hub] ?? '';
    const primaryKeyword = f[at.keyword] ?? '';
    if (!title || !hub || !primaryKeyword) {
      errors.push(`line ${n}: title, hub and primaryKeyword are required`);
      return;
    }
    const intentRaw = (f[at.intent] ?? 'informational').toLowerCase() || 'informational';
    if (!INTENTS.has(intentRaw)) {
      errors.push(`line ${n}: intent must be informational, commercial or seasonal`);
      return;
    }
    const priority = Number(f[at.priority] ?? '3') || 3;
    const languageRaw = (f[at.language] ?? 'ar').toLowerCase() || 'ar';
    if (!isLocale(languageRaw)) {
      errors.push(`line ${n}: language must be ar or en`);
      return;
    }
    rows.push({
      title,
      hub,
      primaryKeyword,
      secondaryKeywords: (f[at.secondary] ?? '')
        .split(/[;|]/)
        .map((k) => k.trim())
        .filter(Boolean),
      intent: intentRaw as TopicRow['intent'],
      priority: Math.min(5, Math.max(1, Math.round(priority))),
      language: languageRaw,
    });
  });
  return { rows, errors };
}
