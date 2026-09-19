# B7R admin panel: design system

The rules for every screen an editor sees at `/admin` (BRD §9.3, ADR-039). Payload renders
the forms and lists; we own the shell, the dashboard, the field widgets and the theme. New
collections, globals and admin components follow this document, `.claude/rules/admin-ui.md`
is the checklist, `tests/admin-config.test.ts` is the gate.

## 1. Principles

1. **One product.** The panel looks and reads like بحر برنت: the brand font, the 13 px radius,
   the accent blue, the same Arabic voice as the site. Payload's dark greys stay, Dhia's
   choice (dark only), the brand sits on top.
2. **Two languages, two axes.** The panel reads in English or in Arabic, chosen per person in
   the account view (Payload's language select and its `payload-lng` cookie; ADR-056, which
   reversed the English-only panel of 2026-09-13). Every string of ours exists in both
   (`admin/strings.ts`), every config label and description is `{ ar, en }`, and Payload
   sets `dir` on the document for Arabic. The UI language is not the content locale: the
   AR / EN pills say which language of a document is open, and neither control moves the
   other. Every text control follows the direction of its own text (`unicode-bidi:
   plaintext`), so Arabic reads right-to-left and a slug left-to-right in both panels.
   Caveat: the direction follows the first strong character, so a title that starts with a
   Latin word aligns left; if that ever bites, an explicit `dir="rtl"` on that field is the
   fix.
3. **Icon + label, always.** An icon never stands alone except in an icon button with an
   `aria-label` and a tooltip. Every collection and global has one icon (§4) and it is the
   same icon everywhere it appears (nav, palette, dashboard, empty state).
4. **One primary action per view.** Blue fill for the one thing to do (save, publish, add);
   everything else is secondary or a link.
5. **Explain before you toggle.** A switch or a destructive button carries one sentence that
   names the consequence on the site («يختفي قسم … من الصفحة الرئيسية عند الإيقاف»).
6. **Nothing reaches the public site.** The admin stylesheet and components live in
   `src/app/(payload)/admin.css` and `src/modules/cms/admin/**`; the site's Tailwind sources
   exclude them and the budget e2e guards the public CSS and JS.

## 2. Tokens

The admin stylesheet declares the **same token names the site uses**, mapped onto Payload's
dark variables (`@theme inline`), so `src/components/shared/*` and `src/components/ui/*`
render in both worlds without a fork. Raw hex lives only in the token block.

| Token | Admin value | Use |
|---|---|---|
| `primary` | `#0058b0` | Blue **fills**, primary buttons, the on state of a switch. White text on it (6.9:1). |
| `primary-hover` | `#1a6ac0` | Hover of a blue fill. |
| `accent` | `#0098e0` | Blue **text, icons, links, focus rings, active nav** (5.7:1 on the page). Never white text on it. |
| `accent-tint` | `rgb(0 152 224 / .14)` | Active/hover background behind accent text. |
| `ground` | `--theme-elevation-0` | Page background (rgb 20 20 20). |
| `surface` | `--theme-elevation-50` | Cards, menus, the flyouts (rgb 34 34 34). Not the sidebar, which stays on `ground` (ADR-058): the identity hues on their tints reach AA on the page colour (blue 4.9:1, violet 5.3:1) and fall under it on the surface (4.1, 4.5); a hue never sits on its tint on a surface, only bare. |
| `text` | `--theme-elevation-1000` | Body text (white). |
| `text-muted` | `--theme-elevation-600` | Secondary text (rgb 181 181 181, 9.5:1). |
| `border` | `--theme-elevation-150` | Hairlines (rgb 60 60 60). |
| `success` / `warning` / `error` | `#3fbf6b` / `#f5b53f` / `#f26b6b` | Status text and badges; each ≥ 4.5:1 on `ground` and `surface`. `success-tint` sits behind green icons. |
| `teal` / `violet` / `pink` / `slate` (+ `-tint`) | `#2dd4bf` / `#a78bfa` / `#f472b6` / `#cbd5e1` | Identity hues (ADR-046): one per sidebar group (`ADMIN_GROUPS` in `icons.ts`; the Site group uses the accent blue), carried by every entity of the group onto the sidebar's discs and active entry, the page header's disc and bar, and the dashboard's discs. Identity, never meaning. Each ≥ 5.8:1 on `surface`; the slate disc is lighter than the 50 % disabled state so the two never read alike. |
| `surface-2` | `--theme-elevation-100` | One step above the surface: the hover of a sidebar entry, neutral in every group. |
| `radius-base` / `radius-lg` / `radius-inner` / `radius-pill` | 13 / 20 / 6 / 999 px | From `src/styles/tokens.css` (shared with the site). |
| `shadow-card` / `shadow-popover` | black at 40 % / 60 % | Depth on the dark surface. |
| `font-sans` | ITF Rayat Round | Also set as Payload's `--font-body`. |

**Blue rule on dark:** `primary` is a fill, `accent` is a colour for text. `text-primary` is
never used in an admin component; `bg-accent` is never used behind white text. The `Badge`
`primary` tone (blue text on a blue tint) is not used in the admin; use `success`, `warning`,
`error` or `muted`.

**Colour that means something** (Dhia, 2026-09-13): the same four meanings everywhere, on
Payload's elements and ours.

| Colour | Means | Where |
|---|---|---|
| Blue (`primary` fill, `accent` text) | the main action, a link, the Site group | Create New, Save, links, focus rings, the Site group's discs. Amended by ADR-046: the active sidebar entry sits on its own group's tint with weight and `aria-current`, so "active" is carried by weight and the tint, and the hue stays identity. |
| Green (`--admin-green`) | publish, live | the publish button of a document with drafts, the Published pill, "answering/running" rows |
| Red (`--admin-red`) | delete, failure | Delete items, row removal, the delete confirmation, failed rows, Log out |
| Amber (`--admin-amber`) | careful | Unpublish, Revert, "off / test mode" rows |

Payload's own selection colour (its "success" ramp: checkboxes, radios, focus rings, the
published pill) is re-hued to the accent in `@layer payload`; its greys are untouched.

## 3. Type, spacing, radius

- Text sizes are the site scale from `tokens.css`: `text-body` 17 px for form copy is Payload's
  business; our surfaces use `text-h4` (20/500) for card titles, `text-small` (15) for rows,
  `text-caption` (13) for meta and descriptions; a dashboard tile's number is `text-h3`.
- A bar (`dashboard/section.tsx`, `Bar`): the fill is the group's identity hue, or amber and
  red when the bar itself carries a warning (no limit, at the cap); it grows from the start
  edge (`inline-size`), so it reads the same in both directions.
- Spacing on the 4 px grid: 8 between icon and label, 12 inside a row, 16 inside a card,
  24 between cards, 32 between dashboard sections.
- Radius: cards and dialogs 13 px, menus 13 px, chips and inputs inside Payload 8 px
  (`--style-radius-m`), key caps and small tiles 6 px, avatars and switches pill.
- Motion: `duration-fast` (150 ms) for hover and focus, `duration-base` (200 ms) for menus and
  tooltips; `motion-reduce:animate-none` on anything that moves.

## 4. Icons

- Library: `lucide-react`, stroke 1.75, through `components/shared/icon.tsx` (directional
  icons mirror in RTL automatically).
- Sizes: 20 px in the sidebar and quick-action tiles, 16 px inline next to text, 24 px alone
  in an empty state.
- Registry: `src/modules/cms/admin/icons.ts`, `COLLECTION_ICONS`, `GLOBAL_ICONS`,
  `ADMIN_GROUPS` (icon, hue, order per group), `ADMIN_NAV` (group, order, parent, section,
  public listing per entity), `NAV_SECTIONS`, `ACTION_ICONS`. A collection or global without
  an entry is a type error and a failing test. Pick a noun icon for a collection (a shirt, a
  file, a question mark), a place icon for a global (a house, sliders), a verb icon for an
  action (an eye for "view site"); a group's icon must not repeat its first entry's.
- Current registry: products `Shirt`, pages `FileText`, faqs `CircleHelp`, testimonials
  `MessageSquareQuote`, integrations `Plug`, media `Image`, redirects `ArrowRightLeft`, users
  `Users`, posts `Newspaper`, categories `FolderTree`, authors `UserPen`, tags `Tag`,
  ai-topics `ListChecks`, ai-runs `History`, connections `KeyRound`, traffic `Footprints`;
  the Traffic view `Signpost`, the Visibility score view `Gauge`, visibility-checklist `ListTodo`, metrics `Camera`, prompts `MessageCircleQuestion`, citations `Quote`;
  home `House`,
  site-settings `Settings2`,
  seo-defaults `Search`, ai-settings `SlidersHorizontal`; groups Site
  `Globe`, Catalogue `ShoppingBag`, Blog `PenLine`, Visibility `Radar`, Admin `Shield`; the
  engine section `Bot`; the dashboard entry `LayoutDashboard` (a place, like a global's).
- Colour: icons inherit text colour. An entity's disc takes its group's hue (§2) in the
  sidebar, the page header, its dashboard tile and the latest changes.

## 5. Writing (Arabic)

The admin's strings are interface copy (ADR-031): written by us, under the ux-araby rules.

- The panel's own strings live in both languages in `modules/cms/admin/strings.ts` (§5a); the
  rules below apply to every Arabic the panel shows: our strings, the config's labels and
  descriptions, and our overrides of Payload's pack (`modules/cms/admin/payload-ar.ts`).
- Labels are nouns: «المنتجات», «الصفحة الرئيسية», «إعدادات الموقع». Never a sentence.
- Actions are verb-first imperatives: «أضف صفحة», «ارفع ملفاً», «عرض الموقع». No «قم بـ».
- **The description rule** (ADR-046; the 2026-09-19 words pass, `.claude/rules/admin-ui.md`
  rule 4): one sentence of what the thing does *on the site* and where, then the limit or an
  example if one helps a decision («حتى 70 حرفاً», «1200×630 أو أكبر»); nothing the label
  already says, nothing about how it is stored, no second sentence that repeats the first.
  The English is written first and trimmed; the Arabic is written **by meaning**, never a
  calque, and a sentence that says where the value shows opens with its verb, the field the
  implied subject and the gender agreeing with it («يظهر تحت العنوان بخط أخف؛ فارغ يخفيه»,
  «تظهر خلف الشريحة على الجوال», «يعلو شبكة البطاقات»), never with a bare place preposition
  («في البطاقة…»: not helper text, a fragment); a spec sentence may stay nominal («كلمتان إلى
  أربع.», «بنسبة 4:5.», «من صفر إلى 5؛ بلا شارات يختفي الصف.»); the English may keep its
  fragment. Every field an editor sees carries one, per entity in
  `modules/cms/admin/descriptions/*.ts`, applied by `describeFields()`; the config test
  enforces both languages, a cap of 140 characters in each as rendered (two lines under a
  field on a 400 px column; a bilingual list may exceed it by its one-clause shared-rows
  note; a named exception carries its reason), never opening with the label's own noun,
  never a storage word, never an Arabic place fragment. Three before and after:
  - Product, «الاسم» (Name). Before: «اسم المنتج كما يظهر في البطاقة، وعنوان صفحته، وقائمة
    المصمّم، وملف llms.txt.» / "The product's name on its card, its page title, the
    designer's picker and llms.txt." After: «يظهر في البطاقة، وعنوان صفحته، وقائمة المصمّم،
    وملف llms.txt.» / "On the card, the page title, the designer's picker and llms.txt." (the
    label already says "name"; the Arabic opens with its verb).
  - Connections, «مفتاح API» (API key). Before: «المفتاح من لوحة الخدمة؛ لـ Search Console ملف
    حساب الخدمة (JSON). يُحفظ مشفّراً ولا يُعرض ثانية؛ اترك القناع للإبقاء عليه.» After: «من
    لوحة الخدمة؛ ولـ Search Console ملف حساب الخدمة (JSON). لا يُعرض ثانية؛ اترك القناع للإبقاء
    عليه.» (how it is stored is not the editor's business; what happens on save is).
  - Site settings, «واتساب (أرقام فقط)» became «WhatsApp (أرقام فقط)», and its sentence «أرقام
    واتساب بلا + ولا مسافات، لرابط wa.me في الأداة وكل أزرار واتساب: 966501699572.» became «بلا +
    ولا مسافات، لرابط wa.me في الأداة وكل أزرار WhatsApp: 966501699572.» (a brand stays
    Latin; the label already says whose digits).
- **The glossary** (`docs/ADMIN-GLOSSARY.md`, rendered from `modules/cms/admin/glossary.ts`
  by `pnpm glossary`): one word per concept in each language, in both directions (no two
  concepts share a word: the test refuses a second row with the same Arabic), and which
  terms stay Latin inside Arabic copy (API, JSON, URL, slug, UTM, CSV, IndexNow, Search Console, Bing
  Webmaster Tools, PageSpeed, Umami, GA4, WhatsApp, Turnstile, Resend, the model ids,
  `alt`, `og:image`, the brands and the product names; Salla, Zid and Misk keep their own
  Arabic names). A refused alternate («الشعار النصي» for the tagline, «سطح المكتب» for the
  desktop, «مزوّد» for the service, «سقف» for a limit, «واتساب») fails
  `tests/admin-glossary.test.ts` anywhere in the panel; the site's copy (BRD-verbatim) is
  reported on, never gated. A new concept is a new row before its first string.
- A switch names its consequence, verb first: «يختفي قسم «لماذا بحر» من الصفحة الرئيسية عند
  الإيقاف.» A switch is «مفعّل» / «معطّل»; a thing that runs is «يعمل» / «متوقف».
- Success and status: light passives or nominal («حُفظت المسودة», «الوظائف تعمل»), never «تم».
- Empty states: why it is empty + the next step: «لا صفحات بعد. أضف الأولى.»
- Errors: what happened + how to recover, no blame: «تعذّر الحفظ. تحقق من الحقول المعلّمة.»
- Numbers Western (`1, 2, 3`) in both languages, dates relative when recent («قبل 3 دقائق»),
  otherwise `dd/MM/yyyy`: all through `modules/cms/admin/format.ts` (§5a); the traffic
  count's day keys (`YYYY-MM-DD`, Riyadh) show as they are, since they are keys that sort and
  match the rows. Brand and product names stay Latin (Shopify, Turnstile, Resend, WhatsApp);
  Salla, Zid and Misk carry their own Arabic names (the glossary says which).
- Counts Arabic declines (one, two, three to ten, eleven and up) are functions in the strings
  tree, never one template with a number dropped in («7 أيام», «30 يوماً»).
- Punctuation: Arabic comma «،», «أو» not «/», no «!». **No em dash anywhere** (ADR-040,
  `.claude/rules/writing.md`, `pnpm check:dash`): a colon or two sentences instead.
- Localised fields (ADR-043): a document reaches the English site when its title-like field
  has an English value. Media alt text is per language; the Arabic value must be Arabic
  script, the English one is free text. Every localised field label carries a neutral pill
  with its language's code (`AR` on the Arabic field, `EN` on the English input beside it or
  the English editor under it, ADR-044): a field with pills is per language, a field without
  one is shared. Both languages are in every form at once (§6a, ADR-057): there is no locale
  switch and no note about one; nothing to register on a new collection or global beyond
  its header (`admin/document/config.ts`).

### 5a. Two languages (ADR-056)

The panel speaks English or Arabic; the person chooses in the account view (Payload's
language select, kept in its `payload-lng` cookie) and Payload sets `lang` and `dir` on the
document. Everything of ours follows the request's language, never the build's.

- **Adding a string:** one key in `adminStrings` (English, the shape) and the same key in
  `adminStringsAr` (`modules/cms/admin/strings.ts`). The Arabic tree is typed as the widened
  English one, so a missing key fails `tsc`; `tests/admin-strings.test.ts` refuses a leaf
  without an Arabic counterpart, a lost `{placeholder}`, and any Arabic that breaks the rules
  above («تم», «قم بـ», «!», «/», a Latin comma, «بنجاح», «الخاص بك», Eastern digits).
- **Reading a string:** a server component takes `i18n.language` from its props (Payload
  hands `i18n` to every server component; a custom view reads
  `initPageResult.req.i18n.language`, `viewLanguage()` in `views/gate.tsx`) and calls
  `adminStringsFor(language)`; a client component calls `useAdminStrings()`
  (`modules/cms/admin/use-admin-strings.ts`, over Payload's `useTranslation`) and
  `useAdminLanguage()` for the code and the direction. Never `const s = adminStrings.x` at
  module top level: that fixes the language at import.
- **Numbers and dates:** `formatNumber`, `formatDate` and `relativeTime` in
  `modules/cms/admin/format.ts` take the language and hand `Intl` a `-u-nu-latn` locale, so
  the digits stay Western in Arabic; nothing else formats a number.
- **Payload's own strings:** its `ar` pack, with ours merged on top from
  `modules/cms/admin/payload-ar.ts` (`i18n.translations.ar`); fix a poor Payload string there,
  keyed exactly as the `en` pack (a wrong key fails `tsc`).
- **The content languages are a different axis:** both are in every form whatever the
  panel's language (ADR-057, §6a); the pills name them, the `bilingual` branch of the trees
  names them as nouns, and no string names an "open" language.
- **Direction:** logical utilities only (§8), directional icons through `Icon` (mirrored by
  name; `mirror={false}` for a glyph that must not flip, like the Enter key), Radix menus
  take `dir` from `useAdminLanguage().direction`, tooltips beside the rail open away from it.
- **A sentence a module owns** (the visibility rules' titles, guides and facts, ADR-049;
  a label a rule gives a listed document) is a `Text` pair (`{ en, ar }`,
  `modules/visibility/types.ts`) written beside the logic that produces it, never a key in
  `strings.ts`; the module picks the language once at its reading (`reading(payload, {
  language })`) so its pages render plain strings. A place in the panel is named in words,
  in the panel's own labels ("Admin, Connections", «الإدارة، الاتصالات»), never with an
  arrow, an environment variable or a code path; `tests/visibility-rules-strings.test.ts`
  reads the pairs under the same rules as the strings test.
- **One place changes the language** (`.claude/rules/admin-ui.md` rule 16): the header
  switch, with the account view's select behind it. No `?lang=`, no per-view override, no
  string or component that assumes a direction; a new surface ships with `check:rtl` clean
  and the e2e's axe pass in both languages. A technical token inside Arabic (a model id, a
  path, a key) stays Latin, in `<bdi>` or the pill, so it reads left-to-right. Every
  editor-facing string is born in both languages, through the trees or the maps, never
  inline: toasts, refusals, empty states and error sentences are strings of the feature.

## 6. Components

| Component | File | Use in the admin |
|---|---|---|
| `Button` | `shared/button.tsx` | `primary` only for the one main action; `secondary`/`ghost`/`link` variants are blue text → **not** on dark; use `variant="inverse"` for a white-on-blue exception. |
| `Card` | `shared/card.tsx` | Dashboard tiles and sections. `hoverable` for tiles that are links. |
| `Badge` | `shared/badge.tsx` | Status: `success` (live, running), `warning` (off, console), `error` (failed), `muted` (n/a). Every checkbox in a list renders as one (`BoolCell`, set by `describeFields`): green Yes / On, red No / Off, never Payload's `true` / `false` pill. The sidebar's count badge (`BadgeMark` in `nav/tree.tsx`) is a different thing: a 16 px solid pill, red or amber, for a number that asks for action (ADR-058), never grey and never a document count. |
| `Icon` | `shared/icon.tsx` | Every icon. |
| `Tooltip` | `ui/tooltip.tsx` | Icon-only buttons and truncated titles. Not for essential information. |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Account menu, row actions, the rail's flyouts (a menu of links: focus in, arrows and a typed letter, Esc back to the trigger). Icon before each item. |
| `Switch` | `ui/switch.tsx` | `enabled` fields (the `EnabledSwitch` widget). Never for an immediate action. |
| `Collapsible` | `ui/collapsible.tsx` | Nav groups; remembers its state in Payload preferences. Its content is the `role="group"` around the entries' list. |
| `CompareBlock` | `modules/pages/blocks/compare.tsx` | A page block (ADR-050): a captioned table with scoped headers and a sticky criterion column, "best for" and "not best for", the read date; no link. Its fields are described in the pages' map. |
| `Dialog` | `ui/dialog.tsx` | The command palette; confirmations; an engine's whole answer from the ledger table (`AnswerDialog`, the answer as prose with the links it cited). |
| `Separator`, `Kbd` | `ui/separator.tsx`, `ui/kbd.tsx` | Group hairlines; key hints («Ctrl K»). |

Payload's own elements (buttons, fields, pills, toasts) are themed in `admin.css` under
`@layer payload`, never re-implemented. The shell pieces built on these primitives:

| Piece | File | Notes |
|---|---|---|
| Sidebar | `modules/cms/admin/nav/*` | One tree, one breakpoint (ADR-058). `nav-client.tsx` is the aside (Payload's outer `nav` classes and its `useNav` state, so the template's grid follows) with the brand row, the tree, the rail and the foot; `tree.tsx` the tree; `rail.tsx` the rail; `groups.ts` the data, `badges.ts` the badges, `keyboard.ts` and `active.ts` the pure rules. **The tree**, top to bottom: the brand row (the logo, a link to the dashboard); the dashboard as an entry; the five task groups (Site · Catalogue · Blog · Visibility · Admin, ADR-046), each a 40 px row (weight 600, an 8 px dot in the group's hue before the name, the chevron at the end; the whole row toggles, `button[aria-expanded]` owning a `role="group"` labelled by it) over its entries: 36 px with a 24 px disc in the group's hue, secondary entries (hubs, authors, tags under Posts; the checklist, snapshots, prompts and citations under the Score page; counts under Traffic) 32 px and 13 px under a 2 px guide line, the content engine a sub-heading inside Blog; a hairline between groups, never between entries. The active entry sits on its group's tint with weight 500, a 3 px bar on the leading edge and a solid disc, `aria-current="page"`, its group forced open (a click closes it for that page only). Hover is `surface-2`, focus the accent ring. No counts; a badge only where a number asks for action (`badges.ts`, red or amber; the runs' and the drafts' numbers and sentences are the dashboard's, ADR-059). **The state** (open or collapsed, each group) lives in Payload's `nav` preference, written whole, keyed by the group's registry key. **Above 1024 px** (Payload's `m`) the sidebar is inline: open at 264 px, or the 64 px **rail** when collapsed by the one button above the account (« open, » collapsed, mirrored in RTL): the brand mark, the dashboard icon, the five group icons (the active group's carries the bar, a group with a badge a dot) and the avatar; a click on a group opens a 224 px flyout with the group's entries (a `DropdownMenu` of links, not modal, opening away from the rail, focus moved in, Esc back; its active entry wears the hue, weight 500 and the bar, no tint). Both the tree and the rail are in the markup and `admin.css` shows one by the aside's open class (`[data-admin-tree]`, `[data-admin-rail-list]`, `[data-rail-hide]`, `[data-rail-center]`), so a collapsed sidebar paints as a rail on the first frame; hydration adds `data-admin-rail`, the tooltips and the flyouts. Payload closes the nav under its `l` breakpoint (1440 px); a layout effect puts the preference back, so 1025 to 1440 px is inline like any desktop. **At 1024 px and under** it is a drawer over the page (320 px, the full width under 768): the header's hamburger opens it, the X at the same spot in the drawer, Esc, a tap on the scrim or a navigation closes it; the page behind is `inert` while it is open; rows are 44 px; the collapse button hides; the account block and the panel's language switch (`language-switch.tsx`, Payload's `switchLanguage`) sit at the foot. |
| Header actions | `modules/cms/admin/header/actions*` | The hamburger (`[data-admin-menu]`, at the leading edge of the header at 1024 px and under, hidden above), a bordered 240 px search box that opens the palette (the Ctrl K hint; 320 px on focus) and a bordered "View website" link with text; both fold to icons at the drawer widths, where each carries its tooltip beside its `aria-label`. Payload's account avatar and its two hamburgers are hidden in `@layer payload` (our account block and our hamburger own them); so is the content locale switcher and its spacer (ADR-057: no locale switch), whose gutter the controls took. The row never spills: Payload's crumbs shrink first, the last one truncating with its ellipsis, while the controls keep their width, so a long title on a 390 px phone (or at 1025 px with the controls at full width) never pushes "View website" past the edge (`admin.css`, the header block). |
| Command palette | `modules/cms/admin/header/palette*` | Ctrl/⌘ K; sections first, then documents of collections with `listSearchableFields` (5 per collection, from two characters); combobox semantics; ranking in `palette-rank.ts`. |
| Account menu | `modules/cms/admin/account/*` | Initials avatar, name, e-mail (LTR), role badge, "My account", "Log out" (red). In the rail only the avatar shows. The one account entry point: Payload's header avatar is hidden. |
| Login | `modules/cms/admin/login/*` | One line under the form; the Turnstile widget above it (ADR-034). |

| Dashboard | `modules/cms/admin/dashboard/*` | Seven sections top to bottom (ADR-059), one server render, the reads in parallel and each guarded (a failed reader shows its section with the "not available" word, never a blank page). (1) The greeting by the Riyadh hour (name in the accent), the 7 / 30 / 90 day range as links at the trailing edge (`?days=`, server-rendered, no client state; `rules.ts`) and the "needs a hand" line (failed runs this week, a connection at its limit, an enabled connection whose last test failed, documents without English, drafts older than a week; each a link, or one sentence). (2) Four tiles, each one link (`tiles.tsx`, `tile-data.ts`): visits with the change against the previous range (`trafficSummary` twice), the cited rate on the category prompts over 28 days with the engines' count, the score with its trend, "went live" in the range with the drafts waiting. (3) Where visits come from (`traffic/admin/traffic-card.tsx`): the bars by group, the top three entry pages, the crawler reads, "All traffic" into the same range. (4) What the assistants say (`visibility/admin/assistants-card.tsx`): per engine the cited and linked rates, the last run, the next run computed from the prompts' periods (`schedule.ts`, `duePrompts`) or the plain sentence; no "Run now" (it costs money). (5) Content (`content-card.tsx`): the home tile with when it was published, one row per content collection with published, drafts (linked to the list filtered on `_status`) and missing English (linked to the first English form), the last five saves by people (`data.ts`: the content groups only, no machine rows, no untitled unsaved draft), "Write a post" and "Add a product" as bordered buttons by permission. (6) Engine and spend (`ai-content/admin/engine-card.tsx`): the state, posts against the monthly cap and today's cost against the daily cap as bars (violet, amber from 80 %, red at the cap), the next slot, one row per AI connection with its spend against its limit (amber with "No monthly limit" when it has none, red at the limit), runs and last test. (7) Server (`server-card.tsx`): a `details` collapsed by default and open when a row is red, the ten health rows (`healthReport()`), the version, the jobs queue as the next run of each scheduled task on the Riyadh clock, "Full report". An editor sees the sections they may open; a reader that needs an admin is skipped. Numbers, dates and moments through `admin/format.ts`; the hooks are `data-admin-dashboard-<section>`. Every in-admin link is Payload's `Link`: no reload. |
| Forms as tabs | `globals/{home,site-settings}.ts`, `collections/{products,posts,pages}.ts` | One tab per section of the site, in site order (ADR-046): Home ten named tabs (Opening slides · Product strip · Designer · Three steps · Video · Why us · Testimonials · Connected stores · FAQ · Bottom banner, each opening on its switch where one exists; a named tab stores under the group's old path and columns), Product four in the card's order (Photos & colours · Basics · Sizes · Print area; the order in the sidebar), Post three (Content · Excerpt & cover · Search; the sidebar in three collapsibles: Publishing with author and dates, Checks with the warnings and the reading time, Engine with origin and the engine actions), Page two (Content · Search), Site settings five (Brand · Contact & social · Menus & footer with a collapsed Advanced group for the three accessibility labels · Numbers and delivery · Analytics; the menus are the named tab `menu`). The tab strip scrolls sideways with edge fades and an accent bar on the active tab (`admin.css`). |
| Page header | `modules/cms/admin/document/entity-header.tsx` | The description slot under Payload's title (`admin.components.Description` on collections, shared with the list view; `admin.components.elements.Description` on globals; registered per config with its `serverProps.entity` through `admin/document/config.ts`): a bar and a disc in the group's hue, the description, "Shows on:" from `admin.custom.shows` (both languages), a link to the public listing where one exists, and on the home page "10 sections, N on" from the saved document (`HomeSectionsCount`). Nothing of ours sits before the document controls (the locale note went with the switch, ADR-057). |
| Blog group | `modules/cms/collections/{posts,categories,authors,tags}.ts` | Posts, hubs, authors, tags (violet, the Blog hue); the post's sidebar carries author, publish and update dates, reading minutes, origin, the editorial warnings (`WarningsField`) and "Last saved"; a publish that breaks a hard rule is refused with the reason (`fields/editorial.ts`, ADR-041). |
| Content engine section (inside Blog) | `modules/ai-content/{settings,topics,runs}.ts`, `modules/ai-content/admin/*` | Admin only. Engine settings in tabs (the connection it writes with, the caps, the style), topics with "Generate now" (`ApiAction`) and a CSV import panel, runs read-only with their connection; the "Engine and spend" section of the dashboard (ADR-059) and a health row; "Regenerate" in an engine post's sidebar (`PostEngineActions`). ADR-042, ADR-047. |
| Traffic (Visibility group) | `modules/traffic/*`, `lib/traffic/*`, `modules/core/analytics/landing-beacon.tsx` | Admin only. The site's own daily count of landings by source and page and of crawler reads by bot (`traffic`, read-only rows written by the batcher's upsert, listed as "Counts" under the page); the "Where visits come from" section of the dashboard with one bar per group (the Visibility pink on the surface track: identity, not meaning), the top channel, the crawler reads, the top entry pages and an empty state (ADR-059); the Traffic page (`/admin/traffic`, `TrafficView`) with 7 / 30 / 90-day ranges, the groups, four tables (channels, sources, landing pages, crawlers) each with an empty state, and the honesty lines. The channel is derived at read (`channelOf`). ADR-048. |
| Visibility score (Visibility group) | `modules/visibility/*` | Admin only. The Score page (`/admin/visibility`, `VisibilityView`): the overall ring (`Ring`, the Visibility pink on the surface track: identity), the site-only number, one card per section with its findings in the order next, missing, done, the status icons by meaning (green done, amber next, red missing), each finding's guide, link and documents, the section's facts; "Recompute"; "up N points since <date>" from the score snapshots; the outside signals as three panels (`Signals`: Search Console, Bing, PageSpeed, each with its snapshot's date, a "Connect" link to Connections when absent, a waiting sentence when connected and not yet pulled) and "Pull now" (`PullNow`, an `ApiAction` on `/api/visibility/pull`). The citation ledger (`Ledger`: one rate card per engine, the per-prompt table with a check or a cross per engine carrying its `aria-label`, or "not run"; the excerpts in a `details`; the competitors line; the "improve" link on an uncited prompt) and "Run now" (`RunLedger`, an `ApiAction` on `/api/visibility/ledger`). The off-site checklist global, the read-only `metrics` snapshots ("Snapshots", `Camera`), the editable `prompts` ("Prompts", `MessageCircleQuestion`) and the read-only `citations` ("Citations", `Quote`) under it. The score tile and the "What the assistants say" section of the dashboard (ADR-059). ADR-049. |
| Custom views | `modules/cms/admin/views/{registry.ts,gate.tsx}`, `ADMIN_VIEWS` in `icons.ts` | A page of ours in the panel: registered with Payload from the registry, listed in the sidebar and the palette like a global (admins only, by the registry's rule), gated by `adminView()` (a visitor to the login with the way back, an editor the "Admins only" sentence) because Payload renders a custom view with a `path` for anyone. Views are left out of the data paths that walk entities. ADR-048. |
| Connections (Admin group) | `modules/connections/*`, `modules/cms/fields/secret-field.ts`, `modules/cms/admin/api-action.tsx` | Admin only. One row per AI account: kind, model, the key (`secretField`: encrypted, masked, kept when the mask comes back), rates, a monthly limit, `EnabledSwitch`; "Test connection" (`ApiAction` to `/api/connections/test`, held while the form is dirty) records its outcome in read-only sidebar fields; "Spent this month" and "Runs this month" are virtual, read from the runs log. ADR-047. |
| Field widgets | `modules/cms/admin/fields/*` | `EnabledSwitch` (switch + the section's consequence), `IconSelect` (lucide tiles), `PlatformSelect` (brand SVG tiles), `SavedByField` (the `lastSavedBy` snapshot as one line, nothing on a create form), `WarningsField` (the post's soft editorial warnings as a list), `JsonView` (a read-only JSON field as a pretty-printed `<pre>`, with a one-line list cell; Payload's Monaco editor is blocked by the admin CSP) and `ReadOnlyLine` (a read-only text, number, date, checkbox or select as one line of words, never a disabled control), the last two attached by `describeFields()` to every read-only field of their kind; all on `FieldShell` (label, description, error), the pickers on `ChoiceGrid` (radiogroup). `BilingualField` (`fields/bilingual/*`, §6a) is the exception: it hosts Payload's own inputs, not `FieldShell`. |
| Preview | `lib/preview-token.ts`, `app/api/preview/*`, `modules/core/draft-bar.tsx` | The preview button opens a signed link → Next draft mode → the page with a warning bar; exit returns to the page. |

**Links inside the admin are Payload's `Link`** (`@payloadcms/ui`): Next navigation with
the route-transition bar, no reload. A plain `<a>` is for the site (new tab) and logout only.

The sidebar has one breakpoint, Payload's `m` (1024 px): inline above it, a drawer at it
and under (ADR-058); Payload's own `l` behaviour at 1440 px is overridden in `admin.css`.
Every view gets 24 px under the header. Payload's locale suffix on localized
labels (`.field-label .localized`, an em dash and the locale's name) is drawn as the locale
pill (ADR-044): the span's own text is hidden, a `::after` shows `AR`, static in the
stylesheet, since the panel edits the default locale and nothing else (ADR-057, no switch).

### 6a. Both languages at once

Dhia's rule (2026-09-18, ADR-057): "one edit for both languages". Every form holds both
languages of every field, and the panel has no locale switch: Payload's localizer, its
per-locale publish and the locale note are gone (PR C of
`docs/plans/2026-09-18-no-locale-switch.md`), no admin URL carries `?locale=` (the proxy
redirects one away), and the REST API alone still answers it. `describeFields()` gives every
localised `text`, `textarea`, `select` and `number` field (one value, no widget of its own)
the `BilingualField` component, outside a list and inside the rows of arrays and blocks
alike, so a new config gets it with no work and there is never a second place to edit a
value. A localised rich text or upload (a heavy field) gets a real sibling field instead,
`twinField(original)` placed right after it in the config: Payload's own editor or picker
renders the English under the Arabic. A list is never localised as a whole (`localized` goes
on the row's subfields, never on the array; the census refuses one that is not the post's
computed `warnings`). Two columns for the light fields, stacked for the heavy ones, a pill
per language, no switch, no note.

- **Layout.** Payload's own field for the Arabic at the start, the same input for the
  English at the end, in a two-column grid that stacks under 32 rem of container width
  (`@container` on the root, so a narrow drawer stacks too). In a `row` the pair takes the
  full line unless the config gives the field a `width`; the other row fields follow. Both
  inputs are Payload's (`TextInput`, `TextareaInput`, `SelectInput`), so they look alike and
  keep Payload's greys, radius and focus; the root therefore carries **no `data-admin-ui`**
  (the shell's element reset would strip Payload's input box) and `data-admin-bilingual`
  with the field's path for the e2e.
- **The pills.** The Arabic field's label carries the AR pill (Payload's localized suffix,
  redrawn by `admin.css`, static since the panel edits the default locale only); the English
  input's label repeats the field's label, the required star, and EN in the same pill
  (`.admin-locale-tag`, the same declarations, one rule in `admin.css`). A field with pills
  is per language and both are in front of you; a field with none is shared.
- **Stacked editors (the heavy twins).** A localised rich text or photo is followed by its
  twin: the Arabic full width, then the English full width under it, each Payload's own
  component (Lexical, the upload picker) with its own pill: the original's AR, the twin's EN
  from its class (`.admin-twin`, `admin.css`), whose label reads "English text" or "English
  photo" and whose description says one Save writes both. The twin's editor runs left to
  right whatever the panel's direction. The twin is filled from the document's own English
  on every admin read (`populateTwins`, a `beforeRead` hook, no extra query) and is null at
  rest: it carries the English only between typing and the save that applies it (an
  autosave keeps it in the draft). A row duplicated in a list keeps its twin (the form
  copies the row), so an English rich text or photo comes along while the English beside
  the light fields starts empty; the list's description says so
  (`SHARED_ROWS_WITH_TWINS_NOTE`).
- **Publishing.** Save and Publish write both languages, always: the Publish menu's
  "Publish in Arabic" and the schedule drawer's locale select are hidden (`admin.css`),
  since a per-locale publish takes a different path through Payload's update and would leave
  the English side where it was; a scheduled publish publishes all.
- **Rows.** Inside an array or a blocks field the pair sits in the row like any other field
  and its entry is keyed by the row's id from the form state, never by the index
  (`hero.slides.<id>.headline`, `blocks.<id>.items.<id>.title`; `data-admin-bilingual`
  carries that key), so a moved row keeps its English, a deleted row's entry is dropped,
  and a duplicated row copies the Arabic only (its English starts empty). The list's
  description ends with that one clause (`SHARED_ROWS_NOTE` in `describe.ts`, appended by the
  pass to every list whose rows are bilingual). A row added and typed in both languages
  lands with both on the same save. The number twin renders Payload's own number markup
  (`field-type number`, an `<input type="number">`; `@payloadcms/ui` exports the field, not
  its input).
- **Prefill and states.** The English is read once per document view (the REST API with
  the editor's cookie, `?locale=en`, `fallback-locale=none`, `draft=true`: the API keeps the
  query the panel lost), shared by every bilingual field on the page, and read again after
  each save. While it loads the other input is
  disabled with "Loading English…" as its placeholder; if the read fails the input stays
  disabled and a red caption says what happened and the way out ("The English text could
  not be loaded. Reload the page to edit it."). Read-only fields disable both inputs.
- **Read-only facts.** A localized value nobody edits (the post's `readingMinutes`, its
  `warnings`, the one list localized as a whole) shows both languages too: the open one
  under its pill, the other under its own from the same shared read (`OtherValue`,
  `LocaleTag` in `fields/bilingual/`), "Loading English…" while it is on its way and "The
  English value could not be loaded. Reload the page." when it is not; `ReadOnlyLine` does
  this for any localized read-only scalar, `WarningsField` for the warnings.
- **Saving.** The other language's edits wait in the hidden `translations` JSON and are
  written by the entity's `afterChange` hook on a Save or Publish, never on an autosave;
  a refusal in the other language fails the whole save with a toast naming the field and
  the language ("Title in English: This field is required."). An entry inside a list sends
  the whole list in the other locale, its rows built from the saved document by id, so a
  Publish that touches any English field of a list validates the whole English list: a
  row added without its English is refused with the field named. After a save the other
  input shows what was written, not the old prefill. A twin rides the same save: the JSON
  holds its base only (a hash of the English rich text, the English photo's id), the value
  is the field; it applies when it differs from the base and the English still matches the
  base, an emptied required English is refused the same way ("Content in English: This
  field is required."), and after the save the twin shows the English as it now stands.
- **Strings.** The placeholder, the error and the language names are the `bilingual`
  branch of both trees in `strings.ts` (§5a), read per render through `useAdminStrings()`,
  the Arabic under §5's rules and the strings test; the twins' labels and descriptions are
  config labels in both languages (`fields/bilingual.ts`). No string names an "open"
  language.
- **Where a guide points.** A finding or a dashboard line that asks for English links the
  form at the field (`#field-<path>`, Payload's input id) and says which column ("the
  English field beside the Arabic title"), never a `?locale=`.

## 7. States

- **Empty:** icon (24 px, muted) + one line + one action. Example: «لا تحويلات بعد. أضف
  الأول عندما تغيّر رابطاً.»
- **Loading:** Payload's own loaders; our server components render with data, so there is no
  spinner on the dashboard.
- **Error:** the Arabic reason + a recovery; status badges turn `error`; never a bare code.
- **Disabled:** 50 % opacity and `cursor-not-allowed`; the tooltip says why when it is not
  obvious.
- **Permission:** an editor never sees an entry they cannot open (the nav and the palette
  filter by `visibleEntities` and permissions); nothing is rendered greyed-out "for admins".

## 8. Accessibility

- Contrast AA on every custom surface (the tokens above are chosen for it); axe runs on
  **our** surfaces (`[data-admin-nav]`, `.app-header`, the palette, the dashboard) in
  `e2e/admin.spec.ts`. Payload's own edit-view chrome has known gaps (unnamed drag handles and
  popup buttons) that are its engine's, not the shell's; its locale label is lifted to AA in
  `admin.css`.
- Focus visible everywhere: Payload's outline is the accent; our components use
  `focus-visible:ring-2 ring-accent/40`.
- Keyboard: the palette opens with Ctrl/⌘ K, arrows move, Enter opens, Esc closes. The
  sidebar (ADR-058) is a `nav` with `aria-label` and one tab stop: Tab lands on the row focused
  last (else the current page's entry, else the first) and leaves after it; Arrow Up and Down
  walk the rows, Home and End jump to the ends, a typed letter jumps to the next row starting
  with it; Enter or Space toggles a group (`button[aria-expanded]`); the current page has
  `aria-current="page"`. The rail's flyouts are menus (arrows, typeahead, Esc back to the
  icon); the drawer moves focus to its X on open and back to the hamburger on close.
- RTL: logical utilities only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`); `check:rtl`
  scans the admin too. Latin tokens (e-mails, URLs, key caps) sit in `dir="ltr"` spans.

## 9. Adding something new

Follow `.claude/rules/admin-ui.md`. In short: a place in `ADMIN_NAV` (group, order, parent
or section) and `admin.group` through `adminGroup()`, an icon, Arabic labels and description,
`admin.custom.shows` in both languages and the header registered through
`admin/document/config.ts`, `useAsTitle`, `defaultColumns`, `listSearchableFields`, a
description on every switch, `admin.preview` if the thing has a route, `pnpm payload
generate:importmap` after any new admin component, and the config test must pass.
