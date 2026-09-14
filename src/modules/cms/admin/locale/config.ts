/**
 * Registers the locale note (ADR-044) on a config with per-language fields. Payload 3 puts a
 * global's document components under `admin.components.elements` and a collection's under
 * `admin.components.edit`; `tests/admin-config.test.ts` checks both. A fresh object per
 * config: Payload's types want mutable arrays, and fifteen configs must not share one.
 */
const LOCALE_NOTE = '@/modules/cms/admin/locale/locale-note#LocaleNote';

export const globalLocaleNote = () => ({ elements: { beforeDocumentControls: [LOCALE_NOTE] } });
export const collectionLocaleNote = () => ({ edit: { beforeDocumentControls: [LOCALE_NOTE] } });
