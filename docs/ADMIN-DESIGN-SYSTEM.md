# B7R admin panel: design system

The rules for every screen an editor sees at `/admin` (BRD §9.3, ADR-039). Payload renders
the forms and lists; we own the shell, the dashboard, the field widgets and the theme. New
collections, globals and admin components follow this document, `.claude/rules/admin-ui.md`
is the checklist, `tests/admin-config.test.ts` and `tests/admin-icons.test.ts` are the gate.

## 1. Principles

1. **One product.** The panel looks and reads like بحر برنت: the brand font, the 13 px radius,
   the accent blue, the same Arabic voice as the site. Payload's dark greys stay, Dhia's
   choice (dark only), the brand sits on top.
2. **English panel, Arabic content.** The UI language is English for everyone (Dhia,
   2026-09-13); labels and descriptions are written in English with an Arabic version kept in
   the config. The content is Arabic: every text control follows the direction of its own
   text (`unicode-bidi: plaintext`), so Arabic reads right-to-left inside the panel. Caveat:
   the direction follows the first strong character, so a title that starts with a Latin
   word aligns left; if that ever bites, an explicit `dir="rtl"` on that field is the fix.
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
| `surface` | `--theme-elevation-50` | Cards, menus, the sidebar (rgb 34 34 34). |
| `text` | `--theme-elevation-1000` | Body text (white). |
| `text-muted` | `--theme-elevation-600` | Secondary text (rgb 181 181 181, 9.5:1). |
| `border` | `--theme-elevation-150` | Hairlines (rgb 60 60 60). |
| `success` / `warning` / `error` | `#3fbf6b` / `#f5b53f` / `#f26b6b` | Status text and badges; each ≥ 4.5:1 on `ground` and `surface`. `success-tint` sits behind green icons. |
| `violet` / `teal` / `orange` / `pink` (+ `-tint`) | `#a78bfa` / `#2dd4bf` / `#fb923c` / `#f472b6` | Dashboard hues: one per entity (`COLLECTION_HUES`, `GLOBAL_HUES` in `icons.ts`), used only on the tinted icon discs of the quick actions and the latest changes. Identity, never meaning. Each ≥ 5.8:1 on `surface`. |
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
| Blue (`primary` fill, `accent` text) | the main action, the active place, a link | Create New, Save, the active nav entry, the home and settings discs, focus rings |
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
  `GROUP_ICONS`, `ACTION_ICONS`. A collection or global without an entry is a type error and a
  failing test. Pick a noun icon for a collection (a shirt, a file, a question mark), a place
  icon for a global (a house, sliders), a verb icon for an action (an eye for "view site").
- Current registry: products `Shirt`, pages `FileText`, faqs `CircleHelp`, testimonials
  `MessageSquareQuote`, integrations `Plug`, media `Image`, redirects `ArrowRightLeft`, users
  `Users`; home `House`, site-settings `Settings2`, navigation `Compass`, seo-defaults
  `Search`; groups المحتوى `LayoutGrid`, الإعدادات `SlidersHorizontal`, الإدارة `Shield`.
- Colour: icons inherit text colour; the active nav item uses `accent`. On the dashboard an
  entity's disc takes its hue (§2), the same hue on its tile and in the latest changes.

## 5. Writing (Arabic)

The admin's strings are interface copy (ADR-031): written by us, under the ux-araby rules.

- The panel's own strings are English (`modules/cms/admin/strings.ts`); the rules below apply
  to the Arabic versions kept in the config and to any Arabic the panel shows.
- Labels are nouns: «المنتجات», «الصفحة الرئيسية», «إعدادات الموقع». Never a sentence.
- Actions are verb-first imperatives: «أضف صفحة», «ارفع ملفاً», «عرض الموقع». No «قم بـ».
- Descriptions are one sentence that says what the thing is *for the site*: «الأسئلة الشائعة
  بمجموعاتها. حتى خمسة أسئلة تظهر في الصفحة الرئيسية.» Not how Payload stores it.
- Consequences before switches: «عند الإيقاف يختفي قسم «لماذا بحر برنت» من الصفحة الرئيسية.»
- Success and status: light passives or nominal («حُفظت المسودة», «الوظائف تعمل»), never «تم».
- Empty states: why it is empty + the next step: «لا صفحات بعد. أضف الأولى.»
- Errors: what happened + how to recover, no blame: «تعذّر الحفظ. تحقق من الحقول المعلّمة.»
- Numbers Western (`1, 2, 3`), dates relative when recent («قبل 3 دقائق»), otherwise
  `dd/MM/yyyy`. Brand and product names stay Latin: Salla, Zid, Shopify, Turnstile, Resend.
- Punctuation: Arabic comma «،», «أو» not «/», no «!». **No em dash anywhere** (ADR-040,
  `.claude/rules/writing.md`, `pnpm check:dash`): a colon or two sentences instead.
- Localised fields (ADR-043): the panel's locale control switches every localised field
  between Arabic and English; a document reaches the English site when its title-like field
  has an English value. Media alt text is per language; the Arabic value must be Arabic
  script, the English one is free text.

## 6. Components

| Component | File | Use in the admin |
|---|---|---|
| `Button` | `shared/button.tsx` | `primary` only for the one main action; `secondary`/`ghost`/`link` variants are blue text → **not** on dark; use `variant="inverse"` for a white-on-blue exception. |
| `Card` | `shared/card.tsx` | Dashboard tiles and sections. `hoverable` for tiles that are links. |
| `Badge` | `shared/badge.tsx` | Status: `success` (live, running), `warning` (off, console), `error` (failed), `muted` (n/a). |
| `Icon` | `shared/icon.tsx` | Every icon. |
| `Tooltip` | `ui/tooltip.tsx` | Icon-only buttons and truncated titles. Not for essential information. |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Account menu, row actions. Icon before each item. |
| `Switch` | `ui/switch.tsx` | `enabled` fields (the `EnabledSwitch` widget). Never for an immediate action. |
| `Collapsible` | `ui/collapsible.tsx` | Nav groups; remembers its state in Payload preferences. |
| `Dialog` | `ui/dialog.tsx` | The command palette; confirmations. |
| `Separator`, `Kbd` | `ui/separator.tsx`, `ui/kbd.tsx` | Group hairlines; key hints («Ctrl K»). |

Payload's own elements (buttons, fields, pills, toasts) are themed in `admin.css` under
`@layer payload`, never re-implemented. The shell pieces built on these primitives:

| Piece | File | Notes |
|---|---|---|
| Sidebar | `modules/cms/admin/nav/*` | Groups (Content · Settings · Administration) as collapsibles that remember their state in Payload's `nav` preference; an icon per entity; `aria-current="page"`; the collapse/expand control and the account block at the foot. Collapsed on a desktop it is a 72 px icon rail with tooltips, still usable, and it is CSS: the server renders one tree, `admin.css` toggles `[data-rail-hide]` / `[data-rail-show]` / `[data-rail-center]` / `[data-rail-list]` while the aside is closed above 1440 px, so the rail paints on the first frame with no shift; hydration adds `data-admin-rail`, tooltips and `aria-label`s. At or under 1440 px it is Payload's drawer without the collapse control. Keeps Payload's outer `nav` classes (layout, drawer). |
| Header actions | `modules/cms/admin/header/actions*` | A bordered search box that opens the palette (with the Ctrl K hint) and a bordered "View website" link with text; icons only under 768 px. |
| Command palette | `modules/cms/admin/header/palette*` | Ctrl/⌘ K; sections first, then documents of collections with `listSearchableFields` (5 per collection, from two characters); combobox semantics; ranking in `palette-rank.ts`. |
| Account menu | `modules/cms/admin/account/*` | Initials avatar, name, e-mail (LTR), role badge, "My account", "Log out" (red). In the rail only the avatar shows. |
| Login | `modules/cms/admin/login/*` | One line under the form; the Turnstile widget above it (ADR-034). |

| Dashboard | `modules/cms/admin/dashboard/*` | Greeting (name in the accent), quick-action tiles by permission in their entity's hue, health card (`healthReport()`, rows with a colour and a sentence), latest saves with who saved them and a relative time (`relative-time.ts`); a draft nobody titled or saved (an unused "Create New") is left out. Every in-admin link is Payload's `Link`: no reload. |
| Blog group | `modules/cms/collections/{posts,categories,authors,tags}.ts` | Posts (violet), hubs, authors, tags; the post's sidebar carries author, publish and update dates, reading minutes, origin, the editorial warnings (`WarningsField`) and "Last saved"; a publish that breaks a hard rule is refused with the reason (`fields/editorial.ts`, ADR-041). |
| AI content group | `modules/ai-content/{settings,topics,runs}.ts`, `modules/ai-content/admin/*` | Admin only. Engine settings in tabs (keys masked, `SecretField`), topics with "Generate now" (`EngineAction`) and a CSV import panel, runs read-only; a "Content engine" card on the dashboard and a health row; "Regenerate" in an engine post's sidebar (`PostEngineActions`). ADR-042. |
| Field widgets | `modules/cms/admin/fields/*` | `EnabledSwitch` (switch + the section's consequence), `IconSelect` (lucide tiles), `PlatformSelect` (brand SVG tiles), `SavedByField` (the `lastSavedBy` snapshot as one line, nothing on a create form), `WarningsField` (the post's soft editorial warnings as a list); all on `FieldShell` (label, description, error), the pickers on `ChoiceGrid` (radiogroup). |
| Preview | `lib/preview-token.ts`, `app/api/preview/*`, `modules/core/draft-bar.tsx` | The preview button opens a signed link → Next draft mode → the page with a warning bar; exit returns to the page. |

**Links inside the admin are Payload's `Link`** (`@payloadcms/ui`): Next navigation with
the route-transition bar, no reload. A plain `<a>` is for the site (new tab) and logout only.

Payload puts the sidebar in a drawer at widths ≤ 1440 px (its `l` breakpoint), the header
hamburger opens it; that is Payload's behaviour, kept. Every view gets 24 px under the header. Payload's locale suffix on localized
labels (`.field-label .localized`) is hidden: the header's locale switcher names the locale,
and the suffix is an em dash.

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
- Keyboard: the palette opens with Ctrl/⌘ K, arrows move, Enter opens, Esc closes; nav groups
  are buttons with `aria-expanded`; the current page has `aria-current="page"`.
- RTL: logical utilities only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`); `check:rtl`
  scans the admin too. Latin tokens (e-mails, URLs, key caps) sit in `dir="ltr"` spans.

## 9. Adding something new

Follow `.claude/rules/admin-ui.md`. In short: group, icon, Arabic labels and description,
`useAsTitle`, `defaultColumns`, `listSearchableFields`, a description on every switch,
`admin.preview` if the thing has a route, `pnpm payload generate:importmap` after any new
admin component, and the config test must pass.
