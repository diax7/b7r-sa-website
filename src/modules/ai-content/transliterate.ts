/**
 * A Latin slug from Arabic (BRD 10.2.4 step 7): the model proposes a slug and this is the
 * fallback and the validator. Letters map to the common Latin spellings, diacritics and
 * tatweel are dropped, everything else becomes a hyphen; at most 40 characters, cut on a
 * word boundary.
 */
export const SLUG_MAX = 40;

const LETTERS: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'th',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'a',
  ء: '',
  ؤ: 'o',
  ئ: 'e',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function transliterate(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFKC').replace(/[ً-ْٰـ]/g, '')) {
    if (/[a-z0-9]/i.test(ch)) out += ch.toLowerCase();
    else if (ch in LETTERS) out += LETTERS[ch];
    else out += ' ';
  }
  const slug = out.trim().replace(/\s+/g, '-').replace(/-+/g, '-');
  if (slug.length <= SLUG_MAX) return slug;
  const cut = slug.slice(0, SLUG_MAX + 1);
  const boundary = cut.lastIndexOf('-');
  return (boundary > 0 ? cut.slice(0, boundary) : cut.slice(0, SLUG_MAX)).replace(/-+$/, '');
}

/** The model's slug when it is a valid one, the transliteration of the fallback text otherwise. */
export function slugFor(proposed: string | null | undefined, fallback: string): string {
  const candidate = (proposed ?? '').trim().toLowerCase();
  if (candidate && SLUG.test(candidate) && candidate.length <= SLUG_MAX) return candidate;
  const slug = transliterate(fallback);
  return SLUG.test(slug) ? slug : 'post';
}
