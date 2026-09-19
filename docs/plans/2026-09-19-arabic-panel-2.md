# The Arabic panel, second pass: the switch top right, the words, the icons (2026-09-19)

Dhia, 2026-09-19: "the admin panel should support Arabic as well; top right, an option to
switch the interface language; RTL handled properly; meaning-based translations, natural and
clear; technical terms and external elements (APIs) in English where appropriate; trim
unnecessary text before translating (keep helpful hints like 'preferred length is 70
characters', remove redundant copy so the dashboard is not heavy); more icons and colours in
the dashboard; this applies to all future features; use the CI/CD cycle."

## What stands (ADR-056, ADR-046, ADR-057, ADR-058, ADR-059)

Payload's UI: `i18n.supportedLanguages { en, ar }`, `fallbackLanguage: 'en'`, our
`admin/payload-ar.ts` over its community pack (198 overrides). Our strings: two typed trees in
`src/modules/cms/admin/strings.ts` (`adminStrings`, `adminStringsAr`), read per render
(`adminStringsFor(language)` on the server, `useAdminStrings()` on the client); every config
label and description an `{ ar, en }` pair through the description maps
(`src/modules/cms/admin/descriptions/*.ts`, `src/modules/*/descriptions.ts`) applied by
`describeFields()`; the visibility rules' sentences `{ en, ar }` beside their logic. Tests:
`tests/admin-strings.test.ts` (both trees, same leaves and placeholders, the ux-araby regexes
over ours and the overrides), `tests/admin-config.test.ts` (a field without both languages
refused), `tests/visibility-rules-strings.test.ts`, `pnpm check:rtl` (no physical CSS). Digits
Western through `admin/format.ts`. The language is Payload's `payload-lng` cookie, set by the
account view's select, and the browser's `Accept-Language` before any choice.

## PR 1: the switch, top right

- A `LanguageSwitch` control in the header's actions (`admin/header/actions-client.tsx`),
  at the header's logical end beside the search and "View website" (top right in English,
  top left in Arabic, like the other controls): two labels, «العربية» / "English", each in
  its own language, `aria-pressed` on the current one, one click switches through Payload's
  own `useTranslation().switchLanguage(code)` (it writes the `payload-lng` cookie, a year,
  path `/`, then `router.refresh()`; no cookie of our own); the control is disabled while
  the promise is pending; the document's `lang` and `dir` follow on the refresh. At 1024 px
  and under it folds to a labelled icon with a tooltip like its neighbours; the phone
  drawer's foot reuses it.
- The account view's select stays (Payload's).
- e2e: the switch at 1440 and 390 in both directions, the cookie by name,
  `html[lang]`/`[dir]`, a typed field surviving the switch, the sidebar's flyout side, axe on
  the header; the Arabic test drives the switch instead of the account page.

## PR 2: the words (the glossary, the trim, the Arabic by meaning)

- `docs/ADMIN-GLOSSARY.md`: one row per concept: the English word, the Arabic word, and
  whether the term stays Latin in Arabic copy (API, JSON, URL, slug, UTM, CSV, CSP, IndexNow,
  Search Console, Bing Webmaster, PageSpeed, Umami, GA4, WhatsApp, Turnstile, Resend, the
  model ids, `alt`, `og:image`, product and brand names). The Arabic word for each concept is
  the one word used everywhere (ADR-046's "one word per thing").
- Every string an editor sees, walked in both languages, entity by entity: labels,
  descriptions, hints, placeholders, empty states, buttons, toasts, refusals, the dashboard,
  the Score page, the sidebar, the notes. The rule for a description: one sentence of what
  the field does on the site and where, then the limit or an example; nothing about how it is
  stored, nothing the label already says, no second sentence that repeats the first. Keep the
  hints that help ("70 characters at most, the search result cuts there"). Delete the rest.
- The Arabic rewritten by meaning under the ux-araby rules; the glossary terms Latin, with
  `dir="ltr"` where a Latin token sits inside Arabic (`<bdi>` or the existing pill).
- Enforced for the future: the glossary is data (`src/modules/cms/admin/glossary.ts`, the
  doc generated from it); `tests/admin-glossary.test.ts` gates the panel (both string trees,
  the overrides, the maps, the config labels, the rules' sentences and guides, the dashboard
  and Score strings: a Latin-kept term never appears translated, the Arabic word for a
  concept never varies) and prints a report, no assertion, over the site's Arabic copy
  (BRD-verbatim, never gated); a cap of 140 characters per description in both languages in
  `tests/admin-config.test.ts`, exceptions named per path with a reason, beside two cheaper
  checks (a description never opens with the label's own noun; never a storage word); and
  the existing both-languages and ux-araby tests. `.claude/rules/admin-ui.md` rule 4
  rewritten with the description rule and the glossary; `docs/ADMIN-DESIGN-SYSTEM.md` §5 the
  same.

## PR 3: icons and colour

- Icons on the form tabs (one per tab from `components/shared/icon.tsx`, a place for a site
  section, a noun for a thing, monochrome, from the registry when the icon stands for an
  entity), on the collapsible group headers, on the dashboard's section titles (already
  partly), on the list views' status column. Colour, one sentence for §2: a screen shows its
  group's hue in at most two places, the entity header's icon tile and the active tab's bar;
  a status colour appears only on the status pill and the `BoolCell`; every other icon is the
  text colour, every other surface neutral. Green is live, amber is draft or careful, red is
  failed or delete; a colour never appears without its word. On the dashboard the card's icon
  takes the group hue, the body stays neutral, never two hues in one card. Axe zero serious at
  1440 and 390 in both languages, a contrast check on the amber pill; the e2e counts hue
  carriers per document (at most one `[data-admin-hue]` tile and one active tab bar).
- The design system §4 (icons) and §2 (tokens) updated; the e2e asserts the tab icons and the
  status pills.

## For every future feature (the rule, in `.claude/rules/admin-ui.md`)

Rule 4 amended and a rule 16 added: every editor-facing string (labels, descriptions,
toasts, refusals, empty states, error sentences) is born in both languages, the Arabic by
meaning under ux-araby, through the strings trees or the description maps, never inline; the
config test refuses a missing pair, the glossary test a translated term, the cap a long
description. The interface language changes in exactly one place (the switch; the account
select behind it): no `?lang=`, no per-view override, no string that assumes a direction; a
new surface ships with `check:rtl` clean and the axe pass in both languages. Digits Western,
dates Riyadh, technical tokens Latin inside Arabic through `<bdi>` or the pill. A control that
carries meaning by colour carries its word; a chrome change is measured at 390, 1024, 1280
and 1440 in both languages.

## Status log

- 2026-09-19: settled with the CTO (Payload's own `switchLanguage`; one cap of 140; the
  glossary gates the panel and reports on the site; one colour carrier per screen; rule 16);
  PR 1 and PR 2 building in parallel, PR 3 after PR 2.
- 2026-09-19: PR 1 built on `admin/language-switch` (ADR-056 amended): the switch in the
  header and the drawer through Payload's `switchLanguage`; the e2e found that Payload's form
  takes the server's state again on the refresh (a reload for the form), so a sentinel in
  every document form marks unsaved changes and the switch asks first ("Switch anyway" or
  "Cancel"; the autosaving documents get their draft back).
- 2026-09-19: PR 3 built on `admin/icons-colour` (ADR-060). Settled with the CTO on the
  phase-1 plan: the tab icons by a portal into Payload's buttons, mapped by index (Payload
  3.89 has no label slot on a tab, and, found in the build, never renders a custom `Field`
  on a `tabs` field either, so the widget is a `ui` field the pass places after the tabs);
  collapsibles and groups through Payload's own Label slot; the header's tile and the active
  tab's bar the two carriers, the label in the text colour; the dashboard one hue per card
  on its title icon, the content card's discs neutral; `_status` through `statusColumn()`
  merged over Payload's base with the cell and the two keys sanitize insists on; three
  words in the list, Published, Draft and Changed («معدّل», its glossary row), the third
  from Payload's `_displayStatus` (3.89's list marks a draft over a published version).
