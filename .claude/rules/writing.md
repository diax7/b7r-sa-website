# Writing rules (every string, everywhere)

Set by Dhia on 2026-09-13 and enforced by `pnpm check:dash` (part of `pnpm lint`, the
pre-commit hook and CI).

## No em dashes, anywhere

The em dash (U+2014) is never used: not in site copy, SEO titles and descriptions,
admin labels and descriptions, e-mails, error messages, alt text, captions, code comments,
docs, specs, ADRs or the BRD. This applies to Arabic and English alike.

Write instead:

- Arabic: the Arabic comma «،», a colon, parentheses, or two sentences.
  «إعادة تعيين كلمة المرور: لوحة بحر برنت», «تيشيرت أساسي، أبيض، الواجهة الأمامية».
- English: a comma, a colon, a semicolon, parentheses, or two sentences.
  "ADR-039: the admin panel", "one function, so the two never disagree".
- Titles and headings: a colon.
- A missing value in a table: a hyphen `-`, never a dash glyph.
- Numeric ranges keep the en dash (`3–10`, `2024–2026`); that is a different character and
  stays allowed.

## The rest (unchanged)

- Arabic interface copy follows the ux-araby rules (see `docs/ADMIN-DESIGN-SYSTEM.md` §5):
  verb-first actions, nominal labels, no «تم» + مصدر, no «قم بـ», Arabic comma, «أو» not «/»,
  no «!».
- Site copy comes verbatim from the BRD copy bank (`tests/content-verbatim.test.ts`).
