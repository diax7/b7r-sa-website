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
   names the consequence on the site («عند الإيقاف يختفي قسم … من الصفحة الرئيسية»).
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
  `text-caption` (13) for meta and descriptions.
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
- Descriptions are one sentence that says what the thing is *for the site*: «الأسئلة الشائعة
  بمجموعاتها. حتى خمسة أسئلة تظهر في الصفحة الرئيسية.» Not how Payload stores it. Since
  ADR-046 every field an editor sees carries one: where it shows and what it does, then the
  limit or an example («يظهر في بطاقة المنتج تحت السعر وفي قائمة المصمّم. قصير: S – 2XL»);
  they live per entity in `modules/cms/admin/descriptions/*.ts` and are applied by
  `describeFields()`; the config test enforces both languages on every field.
- Consequences before switches: «عند الإيقاف يختفي قسم «لماذا بحر برنت» من الصفحة الرئيسية.»
- Success and status: light passives or nominal («حُفظت المسودة», «الوظائف تعمل»), never «تم».
- Empty states: why it is empty + the next step: «لا صفحات بعد. أضف الأولى.»
- Errors: what happened + how to recover, no blame: «تعذّر الحفظ. تحقق من الحقول المعلّمة.»
- Numbers Western (`1, 2, 3`) in both languages, dates relative when recent («قبل 3 دقائق»),
  otherwise `dd/MM/yyyy`: all through `modules/cms/admin/format.ts` (§5a); the traffic
  count's day keys (`YYYY-MM-DD`, Riyadh) show as they are, since they are keys that sort and
  match the rows. Brand and product names stay Latin: Salla, Zid, Shopify, Turnstile, Resend.
- Counts Arabic declines (one, two, three to ten, eleven and up) are functions in the strings
  tree, never one template with a number dropped in («7 أيام», «30 يوماً»).
- Punctuation: Arabic comma «،», «أو» not «/», no «!». **No em dash anywhere** (ADR-040,
  `.claude/rules/writing.md`, `pnpm check:dash`): a colon or two sentences instead.
- Localised fields (ADR-043): the panel's locale control switches every localised field
  between Arabic and English; a document reaches the English site when its title-like field
  has an English value. Media alt text is per language; the Arabic value must be Arabic
  script, the English one is free text. Every localised field label carries a neutral pill
  with the open locale's code (`AR`/`EN`, ADR-044): a field with a pill changes per language,
  a field without one is shared. A document with per-language fields shows the `LocaleNote`
  line before its controls ("Editing the English content. Fields marked EN are per language;
  the rest is shared with Arabic."); register it through `admin/document/config.ts` on every
  new collection or global with a localised field (`tests/admin-config.test.ts` checks).

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
- **The content locale is a different axis:** `useLocale()`, the pills and
  `html[data-content-locale]` say which language of a document is open, whatever the panel's
  language. A component that needs both (the locale note) keys its sentence by the content
  locale inside each UI language.
- **Direction:** logical utilities only (§8), directional icons through `Icon` (mirrored by
  name; `mirror={false}` for a glyph that must not flip, like the Enter key), Radix menus
  take `dir` from `useAdminLanguage().direction`, tooltips beside the rail open away from it.

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
| Sidebar | `modules/cms/admin/nav/*` | One tree, one breakpoint (ADR-058). `nav-client.tsx` is the aside (Payload's outer `nav` classes and its `useNav` state, so the template's grid follows) with the brand row, the tree, the rail and the foot; `tree.tsx` the tree; `rail.tsx` the rail; `groups.ts` the data, `badges.ts` the badges, `keyboard.ts` and `active.ts` the pure rules. **The tree**, top to bottom: the brand row (the logo, a link to the dashboard); the dashboard as an entry; the five task groups (Site · Catalogue · Blog · Visibility · Admin, ADR-046), each a 40 px row (weight 600, an 8 px dot in the group's hue before the name, the chevron at the end; the whole row toggles, `button[aria-expanded]` owning a `role="group"` labelled by it) over its entries: 36 px with a 24 px disc in the group's hue, secondary entries (hubs, authors, tags under Posts; the checklist, snapshots, prompts and citations under the Score page; counts under Traffic) 32 px and 13 px under a 2 px guide line, the content engine a sub-heading inside Blog; a hairline between groups, never between entries. The active entry sits on its group's tint with weight 500, a 3 px bar on the leading edge and a solid disc, `aria-current="page"`, its group forced open (a click closes it for that page only). Hover is `surface-2`, focus the accent ring. No counts; a badge only where a number asks for action (`badges.ts`, red or amber). **The state** (open or collapsed, each group) lives in Payload's `nav` preference, written whole, keyed by the group's registry key. **Above 1024 px** (Payload's `m`) the sidebar is inline: open at 264 px, or the 64 px **rail** when collapsed by the one button above the account (« open, » collapsed, mirrored in RTL): the brand mark, the dashboard icon, the five group icons (the active group's carries the bar, a group with a badge a dot) and the avatar; a click on a group opens a 224 px flyout with the group's entries (a `DropdownMenu` of links, not modal, opening away from the rail, focus moved in, Esc back; its active entry wears the hue, weight 500 and the bar, no tint). Both the tree and the rail are in the markup and `admin.css` shows one by the aside's open class (`[data-admin-tree]`, `[data-admin-rail-list]`, `[data-rail-hide]`, `[data-rail-center]`), so a collapsed sidebar paints as a rail on the first frame; hydration adds `data-admin-rail`, the tooltips and the flyouts. Payload closes the nav under its `l` breakpoint (1440 px); a layout effect puts the preference back, so 1025 to 1440 px is inline like any desktop. **At 1024 px and under** it is a drawer over the page (320 px, the full width under 768): the header's hamburger opens it, the X at the same spot in the drawer, Esc, a tap on the scrim or a navigation closes it; the page behind is `inert` while it is open; rows are 44 px; the collapse button hides; the account block and the panel's language switch (`language-switch.tsx`, Payload's `switchLanguage`) sit at the foot. |
| Header actions | `modules/cms/admin/header/actions*` | The hamburger (`[data-admin-menu]`, at the leading edge of the header at 1024 px and under, hidden above), a bordered 240 px search box that opens the palette (the Ctrl K hint; 320 px on focus) and a bordered "View website" link with text; both fold to icons at the drawer widths, where each carries its tooltip beside its `aria-label`. Payload's account avatar and its two hamburgers are hidden in `@layer payload` (our account block and our hamburger own them); the locale switcher stays in the header, moved into the gutter the avatar left. |
| Command palette | `modules/cms/admin/header/palette*` | Ctrl/⌘ K; sections first, then documents of collections with `listSearchableFields` (5 per collection, from two characters); combobox semantics; ranking in `palette-rank.ts`. |
| Account menu | `modules/cms/admin/account/*` | Initials avatar, name, e-mail (LTR), role badge, "My account", "Log out" (red). In the rail only the avatar shows. The one account entry point: Payload's header avatar is hidden. |
| Login | `modules/cms/admin/login/*` | One line under the form; the Turnstile widget above it (ADR-034). |

| Dashboard | `modules/cms/admin/dashboard/*` | Greeting (name in the accent), quick-action tiles by permission in their entity's hue, health card (`healthReport()`, rows with a colour and a sentence), latest saves with who saved them and a relative time (`admin/format.ts`, in the UI language); a draft nobody titled or saved (an unused "Create New") is left out. Every in-admin link is Payload's `Link`: no reload. |
| Forms as tabs | `globals/{home,site-settings}.ts`, `collections/{products,posts,pages}.ts` | One tab per section of the site, in site order (ADR-046): Home ten named tabs (Hero · Product strip · Designer · Three steps · Video · Why us · Testimonials · Integrations · FAQ · Ribbon, each opening on its switch where one exists; a named tab stores under the group's old path and columns), Product four (Basics · Photos & colours · Sizes · Print area), Post three (Content · Summary & cover · Search; the sidebar keeps author, dates, reading time, origin, engine actions, warnings), Page two (Content · Search), Site settings four (Brand · Contact & social · Menus & footer · Numbers & legal; the menus are the named tab `menu`). |
| Page header | `modules/cms/admin/document/entity-header.tsx` | The description slot under Payload's title (`admin.components.Description` on collections, shared with the list view; `admin.components.elements.Description` on globals; registered per config with its `serverProps.entity` through `admin/document/config.ts`): a bar and a disc in the group's hue, the description, "Shows on:" from `admin.custom.shows` (both languages), a link to the public listing where one exists, and on the home page "10 sections, N on" from the saved document (`HomeSectionsCount`). The locale note stays before the document controls. |
| Blog group | `modules/cms/collections/{posts,categories,authors,tags}.ts` | Posts, hubs, authors, tags (violet, the Blog hue); the post's sidebar carries author, publish and update dates, reading minutes, origin, the editorial warnings (`WarningsField`) and "Last saved"; a publish that breaks a hard rule is refused with the reason (`fields/editorial.ts`, ADR-041). |
| Content engine section (inside Blog) | `modules/ai-content/{settings,topics,runs}.ts`, `modules/ai-content/admin/*` | Admin only. Engine settings in tabs (the connection it writes with, the caps, the style), topics with "Generate now" (`ApiAction`) and a CSV import panel, runs read-only with their connection; a "Content engine" card on the dashboard (its state, its connection with the month's spend and limit) and a health row; "Regenerate" in an engine post's sidebar (`PostEngineActions`). ADR-042, ADR-047. |
| Traffic (Visibility group) | `modules/traffic/*`, `lib/traffic/*`, `modules/core/analytics/landing-beacon.tsx` | Admin only. The site's own daily count of landings by source and page and of crawler reads by bot (`traffic`, read-only rows written by the batcher's upsert, listed as "Counts" under the page); a "Traffic, last 7 days" card on the dashboard with one bar per group (the Visibility pink on the surface track: identity, not meaning), the top channel, the crawler reads and an empty state; the Traffic page (`/admin/traffic`, `TrafficView`) with 7 / 30 / 90-day ranges, the groups, four tables (channels, sources, landing pages, crawlers) each with an empty state, and the honesty lines. The channel is derived at read (`channelOf`). ADR-048. |
| Visibility score (Visibility group) | `modules/visibility/*` | Admin only. The Score page (`/admin/visibility`, `VisibilityView`): the overall ring (`Ring`, the Visibility pink on the surface track: identity), the site-only number, one card per section with its findings in the order next, missing, done, the status icons by meaning (green done, amber next, red missing), each finding's guide, link and documents, the section's facts; "Recompute"; "up N points since <date>" from the score snapshots; the outside signals as three panels (`Signals`: Search Console, Bing, PageSpeed, each with its snapshot's date, a "Connect" link to Connections when absent, a waiting sentence when connected and not yet pulled) and "Pull now" (`PullNow`, an `ApiAction` on `/api/visibility/pull`). The citation ledger (`Ledger`: one rate card per engine, the per-prompt table with a check or a cross per engine carrying its `aria-label`, or "not run"; the excerpts in a `details`; the competitors line; the "improve" link on an uncited prompt) and "Run now" (`RunLedger`, an `ApiAction` on `/api/visibility/ledger`). The off-site checklist global, the read-only `metrics` snapshots ("Snapshots", `Camera`), the editable `prompts` ("Prompts", `MessageCircleQuestion`) and the read-only `citations` ("Citations", `Quote`) under it. A "Visibility score" card on the dashboard with the ring and the three heaviest open items. ADR-049. |
| Custom views | `modules/cms/admin/views/{registry.ts,gate.tsx}`, `ADMIN_VIEWS` in `icons.ts` | A page of ours in the panel: registered with Payload from the registry, listed in the sidebar and the palette like a global (admins only, by the registry's rule), gated by `adminView()` (a visitor to the login with the way back, an editor the "Admins only" sentence) because Payload renders a custom view with a `path` for anyone. Views are left out of the data paths that walk entities. ADR-048. |
| Connections (Admin group) | `modules/connections/*`, `modules/cms/fields/secret-field.ts`, `modules/cms/admin/api-action.tsx` | Admin only. One row per AI account: kind, model, the key (`secretField`: encrypted, masked, kept when the mask comes back), rates, a monthly limit, `EnabledSwitch`; "Test connection" (`ApiAction` to `/api/connections/test`, held while the form is dirty) records its outcome in read-only sidebar fields; "Spent this month" and "Runs this month" are virtual, read from the runs log. ADR-047. |
| Field widgets | `modules/cms/admin/fields/*` | `EnabledSwitch` (switch + the section's consequence), `IconSelect` (lucide tiles), `PlatformSelect` (brand SVG tiles), `SavedByField` (the `lastSavedBy` snapshot as one line, nothing on a create form), `WarningsField` (the post's soft editorial warnings as a list); all on `FieldShell` (label, description, error), the pickers on `ChoiceGrid` (radiogroup). |
| Preview | `lib/preview-token.ts`, `app/api/preview/*`, `modules/core/draft-bar.tsx` | The preview button opens a signed link → Next draft mode → the page with a warning bar; exit returns to the page. |

**Links inside the admin are Payload's `Link`** (`@payloadcms/ui`): Next navigation with
the route-transition bar, no reload. A plain `<a>` is for the site (new tab) and logout only.

The sidebar has one breakpoint, Payload's `m` (1024 px): inline above it, a drawer at it
and under (ADR-058); Payload's own `l` behaviour at 1440 px is overridden in `admin.css`.
Every view gets 24 px under the header. Payload's locale suffix on localized
labels (`.field-label .localized`, an em dash and the locale's name) is drawn as the locale
pill (ADR-044): the span's own text is hidden, a `::after` shows the code from
`html[data-content-locale]`, which the header actions set from `useLocale()`; before
hydration there is no pill rather than a wrong one.

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
