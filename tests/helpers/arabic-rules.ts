/**
 * The ux-araby rules a regular expression can read (design system §5, ADR-040, ADR-056),
 * applied to every Arabic string the panel shows: the admin strings, our overrides of
 * Payload's pack, and the visibility rules' sentences.
 */
export const ARABIC = /[؀-ۿ]/;

/** Brand names, codes and placeholders stay Latin; a string is Arabic once it holds a letter. */
export const LATIN_ONLY = /^[\sA-Za-z0-9,;.:{}()%$/+_-]*$/;

export const RULES: Array<{ name: string; bad: RegExp }> = [
  { name: 'no «تم» + مصدر', bad: /(^|\s)تم(ت|ّ)?\s/u },
  { name: 'no «قم بـ»', bad: /(^|\s)قم\s?ب/u },
  { name: 'no «!»', bad: /!/ },
  { name: 'no «/» between Arabic words («أو» instead)', bad: /[؀-ۿ]\s*\/\s*[؀-ۿ]/u },
  { name: 'no Latin comma between Arabic words («،» instead)', bad: /[؀-ۿ],\s/u },
  { name: 'no em dash', bad: new RegExp(String.fromCharCode(0x2014)) },
  { name: 'no «الخاص بك»', bad: /الخاص(ة)? ب/u },
  { name: 'no «بنجاح»', bad: /بنجاح/u },
  { name: 'no Eastern Arabic digits', bad: /[٠-٩]/u },
];
