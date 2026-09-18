import type {
  CollectionAfterChangeHook,
  CollectionSlug,
  Field,
  GlobalAfterChangeHook,
  GlobalSlug,
  PayloadRequest,
  TypedLocale,
} from 'payload';
import { Refused } from '@/modules/cms/refused';
import {
  entriesOf,
  nestPaths,
  plannedWrites,
  shapeOf,
  TRANSLATIONS,
} from '@/modules/cms/fields/bilingual';

/**
 * Applies the other language's edits after a save (ADR-057). Payload writes one locale per
 * request (`beforeChange` keeps the stored value for every locale but `req.locale`), so the
 * hidden `translations` JSON carries what the editor typed for the other language and this
 * hook writes it with a second update in that locale, inside the same transaction (`req`),
 * clearing the JSON in the same write. Three guard rails, settled with the CTO:
 *
 * 1. A Save or Publish applies; an autosave never does (the entries ride along in the draft
 *    version until a real save).
 * 2. An entry applies only when the editor changed it (`value !== base`) and the other
 *    locale still holds `base`: a stale prefill loses nothing, the stored edit wins.
 * 3. A refusal in the other locale (a required field blanked, a rule of the collection) fails
 *    the whole save: the second write throws, the transaction rolls back, and the message
 *    names the field and the language.
 *
 * The second write runs this hook again with `context.skipTranslations`, so it returns at
 * once; the collection's other hooks (revalidation, the stamps) run for the other language
 * as they would on the locale switch. Only keys the config resolves are ever written
 * (`resolveKey`: a bilingual field, a row the saved document has): the JSON comes from the
 * client. An entry inside a shared list sends the whole list in the other locale, its rows
 * built from the saved document by id (`otherLocaleRows`): Payload's array write is
 * positional and a partial list would drop the other rows.
 */
export const SKIP_TRANSLATIONS = 'skipTranslations';

/** An autosave (`?autosave=true`; Payload parses the flag to a boolean on collections). */
export function isAutosave(req: PayloadRequest): boolean {
  const autosave = req.query?.['autosave'];
  return autosave === true || autosave === 'true';
}

type Doc = Record<string, unknown>;

interface Target {
  type: 'collections' | 'globals';
  slug: string;
  fields: Field[];
  id?: number | string | undefined;
}

/** The locale being saved and the one to write next; null when the config has no other. */
export function localePair(req: PayloadRequest): { current: string; other: string } | null {
  const localization = req.payload.config.localization;
  if (!localization) return null;
  const current = typeof req.locale === 'string' ? req.locale : localization.defaultLocale;
  const others = localization.localeCodes.filter((code) => code !== current);
  return others.length === 1 && others[0] ? { current, other: others[0] } : null;
}

/**
 * Runs a Local API call for the other locale and puts the request back as it was: Payload's
 * `createLocalReq` writes `locale`, `fallbackLocale`, `context` and `query.depth` onto the
 * `req` it is handed, and the hooks after this one (and the response) still need the
 * request's own.
 */
export async function inOtherLocale<T>(req: PayloadRequest, run: () => Promise<T>): Promise<T> {
  const { locale, fallbackLocale, context } = req;
  const depth = req.query?.['depth'];
  try {
    return await run();
  } finally {
    if (locale === undefined) delete req.locale;
    else req.locale = locale;
    if (fallbackLocale === undefined) delete req.fallbackLocale;
    else req.fallbackLocale = fallbackLocale;
    req.context = context;
    if (req.query) {
      if (depth === undefined) delete req.query['depth'];
      else req.query['depth'] = depth;
    }
  }
}

function readOther(req: PayloadRequest, target: Target, other: string): Promise<Doc> {
  const shared = {
    locale: other as TypedLocale,
    fallbackLocale: false as const,
    draft: true,
    depth: 0,
    overrideAccess: false,
    req,
    context: { [SKIP_TRANSLATIONS]: true },
  };
  return inOtherLocale<Doc>(req, async () => {
    if (target.type === 'collections') {
      const id = target.id as number | string;
      const collection = target.slug as CollectionSlug;
      return (await req.payload.findByID({ ...shared, collection, id })) as unknown as Doc;
    }
    const slug = target.slug as GlobalSlug;
    return (await req.payload.findGlobal({ ...shared, slug })) as unknown as Doc;
  });
}

function writeOther(
  req: PayloadRequest,
  target: Target,
  other: string,
  data: Doc,
  draft: boolean,
): Promise<unknown> {
  const shared = {
    locale: other as TypedLocale,
    data,
    draft,
    depth: 0,
    overrideAccess: false,
    req,
    context: { [SKIP_TRANSLATIONS]: true },
  };
  return inOtherLocale<unknown>(req, async () => {
    if (target.type === 'collections') {
      const id = target.id as number | string;
      const collection = target.slug as CollectionSlug;
      return req.payload.update({ ...shared, collection, id });
    }
    return req.payload.updateGlobal({ ...shared, slug: target.slug as GlobalSlug });
  });
}

interface FieldError {
  label?: unknown;
  message?: unknown;
  path?: unknown;
}

/**
 * The refusal an editor reads when the other language will not save: each failing field with
 * its language and Payload's reason, or the collection's own reason with the language first.
 * Payload's error classes are matched by name, not `instanceof` (ADR-031: a class bundled
 * twice fails the check).
 */
export function refusalFor(error: unknown, language: string): Refused | null {
  if (!(error instanceof Error)) return null;
  const { name, message } = error;
  const status = (error as { status?: unknown }).status;
  if (name === 'ValidationError') {
    const errors = (error as { data?: { errors?: FieldError[] } }).data?.errors ?? [];
    const lines = errors.map(
      (e) => `${String(e.label ?? e.path ?? '')} in ${language}: ${String(e.message ?? '')}`,
    );
    return new Refused(lines.length > 0 ? lines.join('; ') : `${language}: ${message}`);
  }
  if (status === 400) return new Refused(`${language}: ${message}`);
  return null;
}

/** The name of a locale as the config labels it, for the refusal. */
function languageName(req: PayloadRequest, code: string): string {
  const locale = req.payload.config.localization
    ? req.payload.config.localization.locales.find((l) => l.code === code)
    : undefined;
  const label = locale?.label;
  if (typeof label === 'string') return label;
  const en = (label as Record<string, string> | undefined)?.['en'];
  return en ?? code;
}

async function apply(req: PayloadRequest, doc: Doc, target: Target): Promise<Doc> {
  if (req.context?.[SKIP_TRANSLATIONS] || isAutosave(req)) return doc;
  const pair = localePair(req);
  if (!pair) return doc;
  const entries = entriesOf(doc[TRANSLATIONS], pair.other);
  if (Object.keys(entries).length === 0) return doc;
  const stored = await readOther(req, target, pair.other);
  const writes = plannedWrites(entries, shapeOf(target.fields), doc, stored);
  if (writes.length === 0) return doc;
  const data = { ...nestPaths(writes), [TRANSLATIONS]: null };
  try {
    await writeOther(req, target, pair.other, data, doc['_status'] === 'draft');
  } catch (error) {
    throw refusalFor(error, languageName(req, pair.other)) ?? error;
  }
  return { ...doc, [TRANSLATIONS]: null };
}

/** Collections: after a Save or Publish, the other language's pending edits are written too. */
export const applyTranslations: CollectionAfterChangeHook = ({ doc, req, collection }) =>
  apply(req, doc as Doc, {
    type: 'collections',
    slug: collection.slug,
    fields: collection.fields,
    id: (doc as Doc)['id'] as number | string | undefined,
  });

/** Globals: the same, through `updateGlobal`. */
export const applyGlobalTranslations: GlobalAfterChangeHook = ({ doc, req, global }) =>
  apply(req, doc as Doc, { type: 'globals', slug: global.slug, fields: global.fields });
