# Plan: Dhia's English-version and shell edits (2026-09-14)

One PR on `fix/english-ux-edits` from `main` (`c3b1bd5`), the cto-cycle. Dhia's review of the
English site and the shell after Level 5, in his words (2026-09-14): the English hero "is so
bad"; the switch "redirects me to the home page"; "the login button is not needed"; the
switch "as an icon"; "those three chips ... make it flexible ... zero or one or three or even
more"; "that white effect that is above the photos ... make it flexible from the admin panel
that I can hide it or change the color of it"; the footer logo "a little bit more bigger"; the
mobile footer in two columns; the mobile menu with the logo, the burger morphing into an X, growing from above;
the header "a little bit more down"; the admin "clear what should be edited in Arabic, what
in English". Decisions he took in the interview: the switch is the translate glyph (option B,
icon only, tooltip names the target language); on phones it lives in the menu's top bar next
to the logo; until he uploads the English photos, `/en` shows mirrored copies of the four
current photos. CTO plan review 2026-09-14: 78, then 93 GO after the revisions below (the English read path has
no locale fallback; a zero-JS tooltip; the WhatsApp line leaves the CMS; burger timing; the
admin pill neutral; the display override nested in the utility).

## Scope note

Ten items, one PR, grouped so each commit is one thing:

1. **The hero in English** (`modules/home/hero`, `styles/globals.css`): the
   layout mirrors instead of the copy sitting on the right; the English display size, line
   height and tracking are the document's own; two of the English strings shortened so every
   headline is two rows and every subline one on desktop.
2. **Hero photos per language** (`cms/globals/home.ts`, migration, seeds, mapper): the two
   upload fields of a slide become `localized`, so the English tab of a slide has its own
   photos. The site reads without locale fallback (`publicRead`, `fallbackLocale: false`), so
   the English tab must be complete, like the headline and subline today; the migration
   copies today's photo into every language row and the seed ships the English placeholders.
3. **Chips 0 to 6** (same global, schema, mapper, carousel): the array is no longer exactly
   three; the row is not rendered when empty.
4. **The overlay from the admin** (same global, schema, mapper, carousel, CSS): `hero.overlay`
   with an `enabled` switch and a colour (Dhia's ask, above: hide it or change its colour).
5. **The switch keeps the page** (`core/header/language-switch.tsx`): the twin path follows
   the current pathname on every render; a page without a twin goes to its section's index in
   the other language, never home.
6. **No login anywhere** (`navigation` global, `site-settings.appUrls`, `lib/utm.ts`, schema,
   seeds, mappers, tests, migration, BRD): the label, the URL, the field.
7. **The switch as an icon** (`language-switch.tsx`, header, mobile menu): the translate
   glyph in a 44 px ring, `aria-label` and a CSS-only tooltip naming the target language (no
   Radix Tooltip in the root layout: BRD 7.8's 180 kB first-paint budget, ADR-014).
8. **Footer** (`core/footer.tsx`): logo 40 → 48 px; below `lg` the brand block spans the row
   and centres, links and policies share one row in two columns, the newsletter spans, the
   badges centre.
9. **Mobile menu and header height** (`core/header/*`, `ui/dialog.tsx`, the `menu-in/out`
   keyframes in `tokens.css`, the `--header-h*` tokens in `globals.css`): the sheet's
   top bar carries the logo, the switch and the X; the burger morphs into the X and back over
   300 ms; the sheet fades in from above; WhatsApp is an icon among the socials (its name from
   the copy bank, the `menuWhatsappLine` field goes, ADR-031); no login; header 72 → 88 px on
   desktop, 60 → 72 px on phones (scrolled stays 60).
10. **Admin: which language am I editing** (`app/(payload)/admin.css`, `cms/admin/header`,
    a `LocaleNote` before the document controls): a neutral pill with the locale code on every
    localized field label, one line under the document controls that says what changes per
    language and what is shared.

Reused: `Dialog` (Radix sheet), `Icon`, `Chip`, `Button`, `EnabledSwitch`,
`FieldShell` (for the colour field), the revalidation hooks, the seed helpers, `mediaAltEn`.

## Approach, by item

### 1. The hero in English

- `globals.css`: drop `[dir='ltr'] .hero-copy` and `[dir='ltr'] .hero-dots` (the copy and
  the dots then sit at the start edge in both documents: right in Arabic, left in English).
  The overlay gradient becomes direction-aware: `to left` in RTL (white at the right, where the
  copy is), `to right` in LTR. `.hero-image` object-position `20% 60%` in RTL, `80% 60%` in
  LTR (the English photos are mirrored compositions: the cluster on the right, the calm area
  on the left under the copy).
- The English document's display: the `display` utility (its one consumer is the hero) nests
  the variant the way `mirror-rtl` does: `&:where([dir='ltr'], [dir='ltr'] *) { font-size:
  clamp(34px, 4.6vw, 56px); line-height: 1.12; letter-spacing: -0.02em }` (Latin Black weight
  wants tracking and a tighter leading, Arabic never does). One place in `globals.css`;
  `tokens.css` is shared with the admin, whose document is also LTR, so nothing document-level.
  Measured on the review server at 1280/1024/390: with 56 px and a 600 px column every English
  headline is two rows except slide 3, every subline one row except slide 4.
- `hero-carousel.tsx`: the copy column `max-w-[560px] ltr:max-w-[600px]`.
- `seed/en/home.ts`: slide 3 headline "Jeddah to the whole Kingdom in 5 days" (was "From
  Jeddah to the whole Kingdom within 5 days", three rows); slide 4 subline "Orders reach us
  automatically and ship under your store name." (was 80 characters, two rows); chip 3
  "Kingdom-wide delivery in 5 days" (was "Delivery across the Kingdom within 5 days", which
  wrapped the row). Same facts, shorter English. Applied to the review database by a one-off
  script; Dhia can edit them in the admin.

### 2. Photos per language

- `cms/globals/home.ts`: `imageDesktop` and `imageMobile` get `localized: true` and a
  description: "Per language and required: the English site reads without fallback. The
  English photo is the mirrored composition (calm area on the left, under the copy)."
- Migration `2026…_hero_photos_per_locale_overlay_no_login.ts` (generated by
  `pnpm migrate:create`, then edited): the two columns move from `home_hero_slides` to
  `home_hero_slides_locales` (and the `_home_v_version_…` pair); before the drop, the
  existing values are copied into every locale row of each slide (`UPDATE … FROM`: the field
  was shared, so each language keeps the photo it had, and `/en` renders throughout). Same
  for the versions tables. `down` restores the columns from the `ar` rows.
- Placeholders: `public/images/hero-en/set-a-desktop.jpg`, `set-a-mobile.jpg`, `set-b-*`:
  the four current shots flipped horizontally by `scripts/hero-crops.ts` (part of
  `pnpm assets`; the files are committed like the Arabic ones; the stored media name is
  `<folder>-<file>`, hence the `hero-en` folder; `mediaAltEn` lists `hero-en-set-a-desktop.jpg`,
  `hero-en-set-a-mobile.jpg`, `hero-en-set-b-desktop.jpg`, `hero-en-set-b-mobile.jpg`, else the
  English alt pass skips them silently). Dhia chose this in the interview knowing the
  printed wordmark reads backwards on them until his English photographs replace them
  (RUNBOOK; ADR-044 records it; the PR shows the mirrored set A). Alt text describes the photo.
- Seeds: the Arabic pass (`migrate-content.ts`, `ensureHome`) uploads the four English files
  next to the Arabic ones (Arabic alt, required in `ar`; `mediaAltEn` supplies the English
  alt in the English alt pass); the English pass (`migrate-content-en.ts`) writes each slide's
  English `imageDesktop`/`imageMobile` from `seed/en/home.ts` paths, looked up by stored
  filename. The review database (already seeded, the English home pass is skipped there) gets
  the assignment from the same one-off script that shortens the strings.
- Mapper `toHome`: unchanged shape (reads the requested locale, no fallback).
- Hero server component: unchanged; the LCP preloads follow the locale's photos.

### 3. Chips

- Global: `minRows: 0`, `maxRows: 6`, `required: false`; description "Zero to six; none hides
  the row. The rows are shared by both languages, the text is per language: a row without an
  English text does not show on the English site."
- Schema: `chips: z.array(nonEmpty).max(6)`. Mapper: `(doc.hero.chips ?? []).map((c) =>
  c.text).filter(nonBlank)` (the array rows are shared, only `text` is localized: a row added
  on the Arabic tab has no English text until it is written, and must not throw for `/en`).
- Carousel: the `<ul>` renders only when `copy.chips.length > 0`; the copy column's gap stays.
- The English seed's `merged(ar.hero?.chips, …)` keeps working with three.

### 4. The overlay

- Global: `hero.overlay` group: `enabled` (checkbox, default true, `EnabledSwitch`,
  description "Off removes the white fade over the photo"), `color` (text, default `#ffffff`,
  validated `#rrggbb`, a `ColorField` admin component: a native colour input beside the hex,
  built on `FieldShell`).
- Schema: `overlay: z.object({ enabled: z.boolean(), color: hex })`; seeds carry the default;
  mapper reads `doc.hero.overlay?.enabled ?? true`, `color ?? '#ffffff'`.
- Carousel: the overlay `<div>` renders when enabled, with `style={{ '--hero-overlay': color }}`;
  CSS uses `color-mix(in srgb, var(--hero-overlay) 92%, transparent)` … `0%` for the stops
  (the stops keep today's alphas: 0.96/0 on phones, 0.92/0.85/0 on desktop).
- Migration: `hero_overlay_enabled boolean DEFAULT true`, `hero_overlay_color varchar DEFAULT
  '#ffffff'` on `home` (`version_hero_overlay_*` on `_home_v`), defaults kept so old rows read
  as today. `pnpm payload generate:importmap` for the new widget.

### 5. The switch keeps the page

Bug: `LanguageSwitch` computed `href` once in an effect keyed on the target only, so after a
client-side navigation the link still pointed at the first page's twin (the home, when the
reader entered on `/`). Fix:

- The rendered `href` is derived from `usePathname()` on every render:
  `localePath(target, stripLocale(pathname).path)`, right for every page with a twin, also
  before hydration and without JavaScript.
- An effect keyed on `pathname` resets the fallback, then reads `<link rel="alternate"
  hreflang="<target>">`; when the page has none (an Arabic-only post, a product with no
  English name), the link falls back to `fallbackPath(target, path)`: a pure function in
  `lib/i18n.ts` (`/blog/*` → the blog index, `/products/*` → the products listing, `/author/*`
  → the blog index, else the home), unit-tested in `tests/i18n.test.ts`. State holds only that
  fallback, so a page with a twin never flashes a wrong link.
- e2e (`english.spec.ts`): enter on `/`, click the nav link to Products, then the switch's
  `href` must be `/en/products`; the same in reverse; a post without a twin goes to the index.

### 6. No login

- `navigation` global: `loginLabel` removed, and `menuWhatsappLine` with it (item 9: the icon's
  name is `socialAria.whatsapp` from the copy bank, an interface string per ADR-031);
  `site-settings`: the `appUrls` group removed (`register` was read by nothing either: the
  app URL is `NEXT_PUBLIC_APP_URL`, BRD §8, RUNBOOK); `lib/utm.ts` `loginUrl` removed with its
  test; schema, seeds (ar/en), mappers, `tests/cms-mapping`, `tests/helpers/engine-store`,
  `scripts/migrate-content*.ts`, `payload-types.ts` (regenerated); migration drops
  `navigation_locales.login_label`, `navigation_locales.menu_whatsapp_line` and
  `site_settings.app_urls_register`/`app_urls_login` (`down` adds them back with a default,
  then drops the default, as the seo-defaults migration does).
- BRD: 6.2 (header: no login), 9.4 (`navigation` fields), 5 (`SiteSettings` shape),
  6.2 mobile menu list.

### 7. The switch as an icon

- `language-switch.tsx` renders `<a>` with the `Languages` icon (lucide) inside a 44 px ring
  (`size-11`, `border-border`, hover `border-primary text-primary bg-accent-tint`),
  `aria-label` from the copy bank (unchanged strings), `lang`/`hreflang`,
  `data-language-switch`, and a CSS-only tooltip: `data-tooltip={LANGUAGE_NAMES[target]}` with
  a `tooltip` utility in `globals.css` (`::after { content: attr(data-tooltip) }` on hover and
  focus-visible, below the control). No visible text, no JavaScript.
- Header (desktop): [nav] … [switch] [CTA]. Mobile header: logo and burger only.
- e2e `english.spec.ts`: the switch is found by `[data-language-switch]`, its accessible
  name is the copy-bank label; the "in its own name" assertion moves from text to the
  tooltip/aria.

### 8. Footer

- Logo `h-10` → `h-12` (48 px; the file is 220 × 80).
- Grid below `lg`: `grid-cols-2`; the brand block `col-span-2 lg:col-span-1` and centred
  (`items-center text-center lg:items-start lg:text-start`); links and policies one column
  each (start-aligned, as Dhia asked); the newsletter `col-span-2 lg:col-span-1`. Badges row
  `justify-center lg:justify-start`. Copyright stays centred.

### 9. Mobile menu, header height

- Tokens: `--header-h: 88px`, `--header-h-mobile: 72px`, `--header-h-scrolled: 60px`. The
  logo sizes stay; the hero's negative margin and the sticky offsets read the same tokens.
- `menu-in`/`menu-out` keyframes: opacity with `translateY(-12px)` → 0 (in, `--duration-slow`,
  `--ease-expand`) and back (out, `--duration-base`). The sheet is `inset-0` as today.
- Sheet top bar: `h-(--header-h-mobile)`, the `Container` padding, the logo link at the
  start (same size as the header's), then `[switch] [X]` at the end. The header's burger is
  hidden while open (as today) and the X renders at the same spot inside the sheet.
- Burger morph: inside the sheet the X stays the base state (as today), and keyframes run
  *from* the burger shape: on `data-[state=open]` each line animates burger → X over
  `--duration-slow` (top line from `translateY(0) rotate(0)` to `translateY(6px) rotate(45deg)`,
  middle fades in reverse, bottom the mirror); on `data-[state=closed]` X → burger over
  `--duration-base`, the same token as `menu-out`, so Radix's Presence (which waits on the
  content node's own animation) never cuts it. Reduced motion: no keyframes, the X shows at
  once. The `dynamic()` loading fallback renders the closed burger so the first open morphs
  once. The header trigger keeps the static burger and hides while open.
- Menu body: links (unchanged), CTA, then the socials row with WhatsApp first (green tint,
  `aria-label` = `copy.socialAria.whatsapp`, `data-track="whatsapp_click"`). The sheet's logo
  link closes the sheet like the nav links.
- e2e `header-menu.spec.ts`: no login; the WhatsApp link found by its accessible name; the
  sheet's logo link; the switch inside the top bar; the trigger reads `data-state`.

### 10. Admin: the language being edited

- `HeaderActionsClient` reads `useLocale()` and sets `document.documentElement.dataset
  .contentLocale` (`ar`/`en`) in an effect (the header is on every view, so portalled drawers
  inherit it); `admin.css` then styles `.field-label .localized` as one neutral pill (elevation
  greys, 6 px radius; colour means something else in the panel): the span's own text
  (Payload's dash and locale name) is `visibility: hidden`, a visible `::after` shows `AR`/`EN` per
  `html[data-content-locale]`, and before hydration (no attribute) no pill at all. Non-localized
  fields carry no pill: shared. Payload's locale control keeps its look.
- `LocaleNote` (`cms/admin/locale/locale-note.tsx`, client, strings in `admin/strings.ts`):
  one line before the document controls: "Editing the English content. Fields marked EN are
  per language; the rest is shared with Arabic." Registered on every global
  (`admin.components.elements.beforeDocumentControls`) and collection
  (`admin.components.edit.beforeDocumentControls`) with localized fields (home, site-settings,
  navigation, seo-defaults, ai-settings, products, pages, faqs, posts, categories, authors,
  tags, testimonials, integrations, media) through a shared constant;
  `pnpm payload generate:importmap`.
- `docs/ADMIN-DESIGN-SYSTEM.md` §on localized fields updated; `e2e/admin.spec.ts` axe pass
  covers a document with the note; `tests/admin-config.test.ts` gains "every config with a
  localized field registers the note" (walking both keys).

## Data and states

- Hero with zero chips: no `<ul>`; with six: the row scrolls on phones, wraps on desktop.
- Overlay off: the copy sits on the photo without the fade (Dhia's call per language? No: the
  overlay group is not localized; one setting for both documents).
- A slide's English photos are required (no fallback on the read path); the migration and the
  seed leave no language row without them.
- The switch on a page without a twin: the section index; on `/` and `/en`: each other.
- Reduced motion: the sheet and the burger morph are static (`motion-reduce:animate-none`).

## Tests

- Unit: `tests/home-mapping.test.ts` (chips 0/6, overlay defaults), `tests/content-schema`
  (seeds parse), `tests/utm.test.ts` (no login), `tests/cms-mapping.test.ts`,
  `tests/admin-config.test.ts` (overlay `enabled` rule, locale note coverage), the copy
  verbatim test (no copy-bank change expected).
- e2e: `header-menu`, `english`, `home-hero` (overlay attribute, chips), `a11y-and-budgets`
  (axe on the new menu/tooltip), `admin` (locale note).
- Screenshots at 390/768/1024/1280 in both languages, before/after, in the PR.

## Docs

- ADR-044: "Dhia's shell and English edits": the hero mirrors with per-language photos
  (reverses ADR-043's "copy at the inline end over the same photo" on Dhia's word; the mirrored
  placeholders' reversed wordmark is an accepted interim), the switch keeps the page and falls
  back to the section index (was the home), the switch is an icon, login and the WhatsApp line
  leave the CMS, the admin locale pill.
- BRD sections 6.2 (header, menu, switch), 6.3.2 (footer), 6.4.1 (hero: photos per language,
  chips 0..6, overlay), 9.4/5 (fields), rebuilt; RUNBOOK (English hero photos to replace,
  overlay, header tokens).

## Judgment calls

- The whole `appUrls` group goes, not only `login`: nothing read `register` either.
- English hero copy shortened in three places (item 1) rather than a smaller type size than
  56 px: the size already matches the Arabic presence; the long strings were the problem.
- The header height is the resting state only; scrolled stays 60 px so the shrink still reads.
- The tooltip on the switch is CSS only; on phones the ring plus `aria-label` is the control
  (Dhia chose icon-only).
- `chips.text` stays required per language in the admin; the mapper still filters a blank
  English text so a row added on the Arabic tab cannot break `/en`.
