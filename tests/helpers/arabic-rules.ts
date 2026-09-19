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
  // A counted noun agrees with its number (`arabicCount` in `admin/strings.ts` is the
  // pattern, with its four forms: «زائر واحد», «زائران», «5 زوّار», «25 زائراً»): three to
  // ten take the plural, eleven and up the accusative singular. The two shapes a regular
  // expression can catch: a number from 3 to 10 before a word ending in «اً», and a number
  // from 11 up before a sound plural («ون», «ين», «ات»).
  {
    name: 'a count of 3 to 10 takes the plural («5 زوّار»), never «5 زائراً»',
    bad: /(^|\s)([3-9]|10)\s[؀-ۿ]+اً(?![؀-ۿ])/u,
  },
  {
    name: 'a count of 11 and up takes the accusative singular («25 زائراً»), never «25 مستندات»',
    bad: /(^|\s)(1[1-9]|[2-9]\d|\d{1,3}(,\d{3})+|\d{3,})\s[؀-ۿ]+(ون|ين|ات)(?![؀-ۿ])/u,
  },
];
