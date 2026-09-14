import type { FactNumber, FactUnit } from '@/modules/ai-content/facts';

/**
 * Deterministic checks on a draft (BRD 10.2.4 step 5, 10.2.5): the numbers a draft states
 * must exist on the facts sheet, banned phrases and Latin paragraphs cost points, em dashes
 * and AI mentions are refusals, and the length must fit. Pure; the model's rubric is added
 * on top by the review step.
 */
export interface Deduction {
  rule: 'numbers' | 'bannedPhrase' | 'latin' | 'length' | 'emDash' | 'aiMention' | 'firstPerson';
  points: number;
  detail: string;
}

export interface CheckResult {
  words: number;
  deductions: Deduction[];
  /** A refusal: the draft cannot publish whatever the model scores it. */
  refused: string[];
}

export interface CheckOptions {
  bannedPhrases: string[];
  minWords: number;
  maxWords: number;
}

const EM_DASH = String.fromCharCode(0x2014);
const AI_MENTION = /ذكاء اصطناعي|الذكاء الاصطناعي|نموذج لغوي|\bAI\b|ChatGPT|GPT-|LLM/i;

/** A number followed by a unit word: ريال, يوم, سم, غرام, منتج (with the Arabic suffixes). */
const NUMBER_WITH_UNIT =
  /(\d+(?:[.,]\d+)?)\s*(ريالاً|ريالات|ريال|يوماً|أيام|يوم|سم|غراماً|غرام|جم|منتجات|منتج)/g;

const UNIT_OF: Record<string, FactUnit> = {
  ريال: 'sar',
  ريالاً: 'sar',
  ريالات: 'sar',
  يوم: 'days',
  يوماً: 'days',
  أيام: 'days',
  سم: 'cm',
  غرام: 'g',
  غراماً: 'g',
  جم: 'g',
  منتج: 'count',
  منتجات: 'count',
};

export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Every number-with-unit the draft states. */
export function statedNumbers(text: string): Array<{ value: number; unit: FactUnit; raw: string }> {
  const out: Array<{ value: number; unit: FactUnit; raw: string }> = [];
  for (const match of text.matchAll(NUMBER_WITH_UNIT)) {
    const value = Number(match[1]!.replace(',', '.'));
    const unit = UNIT_OF[match[2]!];
    if (unit && Number.isFinite(value)) out.push({ value, unit, raw: match[0] });
  }
  return out;
}

/** Numbers the facts sheet does not carry, by unit: a claim the engine may not make. */
export function unknownNumbers(
  text: string,
  facts: FactNumber[],
): Array<{ value: number; unit: FactUnit; raw: string }> {
  const known = new Set(facts.map((f) => `${f.unit}:${f.value}`));
  return statedNumbers(text).filter((n) => !known.has(`${n.unit}:${n.value}`));
}

/** Paragraphs (blank-line separated) with more Latin than Arabic letters and four Latin words. */
export function latinParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => {
      const words = p.match(/[A-Za-z]{2,}/g)?.length ?? 0;
      const latin = p.match(/[A-Za-z]/g)?.length ?? 0;
      const arabic = p.match(/[؀-ۿ]/g)?.length ?? 0;
      return words >= 4 && latin > arabic;
    });
}

const SENTENCE_START_ONLY = new Set(['هناك']);

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Banned phrases as whole words: «تم» is the auxiliary, not the start of «تمام»; «هناك» is
 * banned at the start of a sentence only (BRD 4.1), so «موجود هناك» passes. A phrase that
 * ends with «بـ» matches a following word too.
 */
export function bannedPhrasesIn(text: string, phrases: string[]): string[] {
  return phrases
    .map((p) => p.trim())
    .filter((p) => {
      if (!p) return false;
      const body = escapeRegExp(p);
      // A phrase ending in tatweel («قم بـ») glues onto the next word: no boundary after it.
      const tail = p.endsWith('\u0640') ? '' : String.raw`(?![\p{L}])`;
      const pattern = SENTENCE_START_ONLY.has(p)
        ? String.raw`(?:^|[.؟!:\n])\s*` + body + tail
        : String.raw`(?:^|[^\p{L}])` + body + tail;
      return new RegExp(pattern, 'u').test(text);
    });
}

/** «نحن» claims outside the facts: a soft deduction, the review reads them against the sheet. */
const FIRST_PERSON = /\b(نضمن|نعدك|نعدكم|نوعد)\b/g;

export function checkDraft(text: string, facts: FactNumber[], options: CheckOptions): CheckResult {
  const deductions: Deduction[] = [];
  const refused: string[] = [];
  const words = wordCount(text);
  const unknown = unknownNumbers(text, facts);
  if (unknown.length > 0) {
    deductions.push({
      rule: 'numbers',
      points: Math.min(30, unknown.length * 10),
      detail: `Numbers not on the facts sheet: ${unknown.map((n) => n.raw).join(', ')}`,
    });
  }
  const banned = bannedPhrasesIn(text, options.bannedPhrases);
  if (banned.length > 0) {
    deductions.push({
      rule: 'bannedPhrase',
      points: Math.min(25, banned.length * 5),
      detail: `Banned phrases: ${banned.join(', ')}`,
    });
  }
  const latin = latinParagraphs(text);
  if (latin.length > 0) {
    deductions.push({
      rule: 'latin',
      points: Math.min(25, latin.length * 10),
      detail: `${latin.length} paragraph(s) in Latin script`,
    });
  }
  if (words < options.minWords || words > options.maxWords) {
    deductions.push({
      rule: 'length',
      points: 10,
      detail: `${words} words; ${options.minWords} to ${options.maxWords} expected`,
    });
  }
  const promises = text.match(FIRST_PERSON) ?? [];
  if (promises.length > 0) {
    deductions.push({
      rule: 'firstPerson',
      points: 5,
      detail: `Promises in the first person: ${[...new Set(promises)].join(', ')}`,
    });
  }
  if (text.includes(EM_DASH)) refused.push('An em dash in the text');
  if (AI_MENTION.test(text)) refused.push('A mention of AI in the text');
  return { words, deductions, refused };
}

/** The deterministic part of the score: 100 minus the deductions, never below 0. */
export function deterministicScore(result: CheckResult): number {
  return Math.max(0, 100 - result.deductions.reduce((n, d) => n + d.points, 0));
}
