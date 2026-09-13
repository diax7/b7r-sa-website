# Writing rules (every string, everywhere)

Set by Dhia on 2026-09-13 and enforced by `pnpm check:dash` (part of `pnpm lint`, the
pre-commit hook and CI).

## No em dashes, anywhere

The em dash (U+2014) is never used: not in site copy, SEO titles and descriptions,
admin labels and descriptions, e-mails, error messages, alt text, captions, code comments,
docs, specs, ADRs or the BRD. This applies to Arabic and English alike.

Write instead, by what the dash was doing:

- A label and its value, a heading and its body, a title and its explainer: a **colon**.
  «صمّم منتجك: ارفع تصميمك وشاهده على المنتج فوراً», "ADR-039: the admin panel".
  Several pairs on one line: a **semicolon** between the pairs.
- A pause between two clauses that could stand alone: a **semicolon** or a **full stop**,
  never a comma (that makes a comma splice).
- An aside inside running prose: a comma in English («،» in Arabic) or parentheses.
- A missing value in a table cell: leave the cell empty (or write `n/a`), never a dash glyph.
- Numeric ranges keep the en dash (`3–10`, `2024–2026`); that is a different character and
  stays allowed.

`pnpm check:dash` also fails on a table cell that holds only a comma (an English or an Arabic
one): the trace a mechanical replacement leaves behind.

## The rest (unchanged)

- Arabic interface copy follows the ux-araby rules (see `docs/ADMIN-DESIGN-SYSTEM.md` §5):
  verb-first actions, nominal labels, no «تم» + مصدر, no «قم بـ», Arabic comma, «أو» not «/»,
  no «!».
- Site copy comes verbatim from the BRD copy bank (`tests/content-verbatim.test.ts`).
