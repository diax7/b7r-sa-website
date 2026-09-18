# One edit for both languages: the last 61 fields, then no locale switch (2026-09-18)

Dhia, after seeing the live panel: "there is no editing for the English content separated
from the Arabic; something that has Arabic and English has the two fields next to each other,
not a switch of where you are editing; the header's locale change is the same thing; I don't
want to be switching between them, one edit for both languages." This reverses the part of
ADR-057's memo that kept rich text, arrays, blocks and uploads on the locale switch. The
mechanism merged in PR #39 stands (a hidden `translations` JSON, one nested update in the
same transaction, autosaves skipped, the base check, a refusal naming field and language);
each class below extends it. CTO settlement of 2026-09-18, recorded here as the plan.

**The rule that settles the classes:** a light field (text, textarea, select, number) keeps
the JSON entry; a heavy field (rich text, upload) gets a real sibling twin field that
Payload's own component renders.

## PR A: localized subfields inside arrays and blocks (51 texts + two restructures)

- Entries keyed by the row's id, never the index: `slides.<rowId>.eyebrow`,
  `blocks.<rowId>.title`, nested `blocks.<rowId>.items.<itemId>.question`. The admin form
  makes the id on the client when a row is added (`ADD_ROW` in
  `@payloadcms/ui/dist/forms/Form/fieldReducer.js`), the server keeps a supplied id (the
  seed already relies on it), and Payload's own locale merge for rows is id-keyed
  (`payload/dist/fields/hooks/beforeChange/getExistingRowDoc.js`).
- New row: the English lands on the same save (the twin writes the entry under the client
  id with `base: null`; the hook resolves the id in `doc` and in the English read). Reorder:
  ids are stable, entries follow. Delete: an entry whose id is not in `doc` is dropped.
  Duplicate: the copy's English starts empty (say so in the field description).
- The nested English write sends the whole array for an array with planned writes: for
  each row of `doc` by id, the non-localized subfields from `doc`, the localized subfields
  from the stored English row matched by id (`null` for a new row), the planned writes
  overlaid; never the Arabic values on localized subfields. `bilingualPaths()` becomes a
  config walk that also yields, per array path, which subfields are localized; blocks carry
  `blockType` from `doc`; nested arrays inside blocks recurse.
- Allow-list at apply time: each entry key resolved against the config with the row's
  `blockType` checked; the leaf must be a localized light field. A crafted id cannot create
  a row (the rows sent are `doc`'s).
- Client: the `Bilingual` component maps its index path (`slides.0.eyebrow`) to the id key
  by reading `slides.0.id` from form state; `isBilingualField` stops excluding rows;
  `number` joins the light set.
- Localized-as-a-whole arrays cannot be paired: `posts.takeaways` (paired by `_order`, as
  `migrate-content-en.ts` created the English rows) and `seo-defaults.routes` (paired by
  `route`) become non-localized arrays with localized subfields, one additive migration
  each, the Arabic row's id kept, the versions tables covered where drafts exist. These
  two commits go first.
- Tests: reorder, delete, a new row on the same save, a nested block array, a crafted id,
  a crafted non-localized path, Arabic never copied into an untouched English row.

## PR B: heavy twins (rich text and uploads)

- Form state exists only for config paths, so a second editor on `translations.en.body`
  is impossible; each localized richText `<name>` gets a sibling `<name>Twin` (`richText`,
  non-localized, the same `editor`, right after it, bilingual label and description, an
  `ltr` wrapper); Payload's Lexical renders it: Arabic full width, English full width under
  it, each with its pill. Inside the `richText` block the twin is `bodyTwin`, riding PR A's
  row build. Uploads the same: `imageDesktopTwin` / `imageMobileTwin` (`upload`, the same
  `relationTo`) under the Arabic picker, no custom picker.
- Population: a collection/global `afterRead` hook (when `req.user` is set, `req.locale` is
  the default locale, not `findMany`, not under the re-entry flag) reads the English
  (`fallbackLocale: false`, `draft: true`, `depth: 0`) and fills every twin, rows by id;
  one extra read per admin single-document read; site reads pay nothing.
- Apply: the twin is one more entry; the base is a sha256 of the canonical JSON (an upload's
  base is the stored id); the nested English write carries the value and nulls the twin
  and the JSON. At rest the twin is null. If the hash guard runs past about thirty lines,
  last-writer-wins for the four heavy fields with the version record as the net, said in
  ADR-057.
- Tests: the population guards, apply differs / equal / stale, the twin null after apply,
  a block-row twin by id; an e2e on the post body.

## PR C: no switch

- Only when the census test reads zero: every localized field is a light field with the
  `Bilingual` component or a heavy field followed by its twin, and no localized-as-a-whole
  array exists.
- Hide Payload's localizer in `@layer payload`; delete the locale note and its rows in
  `admin.css`, and the `localized` option of the header components if nothing reads it;
  the pills stay; `localized: true` stays on every field (the data model is unchanged).
- Two traps: `?locale=en` upserts a persistent `locale` preference
  (`@payloadcms/next/dist/utilities/getRequestLocale.js`), so the PR ships a migration
  `DELETE FROM payload_preferences WHERE key = 'locale'`, rewrites the visibility guides
  that link a field in the missing locale to link the field and name the column, and adds
  a check that no `?locale=` survives under `src/`; and the removal lands last.
- Wording that names an "open language" goes with the switch: `SHARED_ROWS_NOTE` becomes
  "a duplicated row copies the Arabic only; its English starts empty" and `locale.legend`
  reads Arabic / English without a current locale (the CTO's PR A review).
- Docs: ADR-057 amended with Dhia's sentence and the light/heavy rule; design system §6a
  rewritten; admin-ui rules 2b and 12; the e2e asserts no localizer, both columns in one
  form, an English text and an English row landing in `?locale=en` REST reads after one
  save, the empty-English case, axe on the stacked editor.

## What Payload 3.89 makes impossible (not promised)

1. One write for two locales (`update` writes `req.locale` only): always the main save plus
   one nested update in one transaction.
2. Form state for a path not in the config.
3. Pairing rows of a localized-as-a-whole array.
4. Pinning the admin locale by hiding the switch; the preference persists until purged.
5. A field-level `afterRead` seeing a sibling's other-locale value deterministically.
6. An English autosave: twin values ride the draft and apply at the manual save.

## Checked before building (the developer confirms each in the package)

`fieldReducer.js` (`ADD_ROW` makes the id, `DUPLICATE_ROW` makes a new one),
`getExistingRowDoc.js` (id match), `getRequestLocale.js` (the preference upsert), the
collection `afterRead` hook args (`findMany` present), `RscEntryLexicalField` reading its
path from the config.

Checked on 2026-09-18 in the installed packages (Payload 3.89.0), one line each:

- `@payloadcms/ui/dist/forms/Form/fieldReducer.js:25`: `ADD_ROW` sets
  `id: subFieldState?.id?.value || new ObjectId().toHexString()` and writes
  `${path}.${rowIndex}.id` into the form state (line 53); the id is made on the client.
- `@payloadcms/ui/dist/forms/Form/fieldReducer.js:141`: `DUPLICATE_ROW` gives the copy
  `new ObjectId().toHexString()`, and every nested row id too (line 160).
- `payload/dist/fields/hooks/beforeChange/getExistingRowDoc.js:7`: a row is matched by
  `existingRow.id === incomingRow.id`, else `{}`; `beforeChange/promise.js:210` hands that
  match to each row as `siblingDoc` and `siblingDocWithLocales`, so a localized subfield
  keeps its other-locale value by the row's id.
- `@payloadcms/drizzle/dist/transform/write/array.js:22`: a supplied row id is stored as the
  row's `id` (moved to `_uuid` on a versions table); the server keeps the client's id.
- `@payloadcms/next/dist/utilities/getRequestLocale.js:10`: `upsertPreferences({ key:
  'locale' })` on every `?locale=` (PR C's trap).
- `payload/dist/collections/config/types.d.ts:138`: `AfterReadHook` args carry
  `findMany?: boolean`; `collections/operations/find.js:258` passes `findMany: true`.
- `@payloadcms/richtext-lexical/dist/field/rscEntry.js:12`:
  `const path = args.path ?? args.clientField.name`: the editor stands on a config path
  (PR B's twin is a real field).
- `@payloadcms/ui/dist/providers/DocumentInfo/index.js:298`: the admin saves with
  `depth: 0` and `fallback-locale: null`; `payload/dist/collections/operations/utilities/
  update.js:50` reads the original document of an update by id with `fallbackLocale: null`,
  so an English write never fills an untouched English field from the Arabic.
- `seo-defaults.routes` is already a non-localized array with localized `title` and
  `description` (`src/migrations/20260913_091427_initial.ts:331`, `seo_defaults_routes` +
  `seo_defaults_routes_locales`, paired by id): no restructure, no migration. Only
  `posts.takeaways` is localized as a whole (`posts.warnings` is too, but computed and
  read-only: a fact, not an edit).

## Status log

- 2026-09-18: settled with the CTO; PR A building.
- 2026-09-18: PR A built on `admin/bilingual-rows`: 55 localized light fields inside rows
  bilingual (the census in `tests/admin-config.test.ts`), one restructure (`posts.takeaways`,
  migration `20260918_114349_takeaways_rows_shared`; `seo-defaults.routes` already had the
  shape), the row builder and its tests, two e2e run on a private server and database. What
  remains: rich text (one field, the page block's body) and uploads (the hero's two photos),
  PR B; then PR C.
- 2026-09-18: PR B built on `admin/bilingual-heavy`: the four heavy fields (the page block's
  body, the post's body, the hero's two photos) have their twins, `twinField()`, the
  population as a `beforeRead` hook with no extra read (an `afterRead` hook runs inside
  `update` too and would clobber the typed twin: ADR-057's amendment says why), the apply
  with the hash base, migration `20260918_131849_heavy_twins`, the census reads every
  localized field of one value covered; two e2e run on a private server and database. What
  remains: PR C.
- 2026-09-18: PR C built on `admin/no-switch`: the census gate read zero (125 light fields
  paired, 55 in rows, the four heavy ones by their twins; the post's `warnings` and
  `readingMinutes`, both computed and read-only, named as the two facts without a pair),
  then Payload's localizer, the per-locale publish and the schedule drawer's locale select
  hidden in `@layer payload`, the locale note and the `localized` option deleted, the
  `locale` strings gone, the row notes reworded, the guides linking the field's anchor and
  naming the column, migration `20260918_142817_purge_locale_preference`, the proxy
  answering an admin `?locale=` with a 307 without it; thirteen e2e run on a private server
  and database (port 3014, `b7r_noswitch`). CTO review (89): the post's two facts now show
  both languages through their widgets (`WarningsField`, `ReadOnlyLine` with the shared
  read), so the gate lists no exception; the 307's `Location` stays absolute on the
  request's origin (Next's adapter answers a relative one with a 500, checked on the
  server) and is relativised by the adapter. Later polish: a guide's field anchor scrolls only when the field's tab is
  active (the guides name the tab); a click that opens the tab first would finish it.
