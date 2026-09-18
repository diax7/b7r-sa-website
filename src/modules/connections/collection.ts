import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  PayloadRequest,
} from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { inLanguage } from '@/modules/cms/fields/message';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { secretField } from '@/modules/cms/fields/secret-field';
import { Refused } from '@/modules/cms/refused';
import { CONNECTION_DESCRIPTIONS } from '@/modules/connections/descriptions';
import {
  CONNECTION_KINDS,
  isConnectionKind,
  isServiceKind,
  KINDS,
  mockAllowed,
  ratesForModel,
} from '@/modules/connections/kinds';
import { spendFor } from '@/modules/connections/spend';

export const CONNECTIONS = 'connections' as const;

const HTTPS = /^https:\/\/[^\s"'<>]+$/;

/** A new connection that leaves the model or a rate empty gets its kind's usual value. */
const fillFromKind: CollectionBeforeValidateHook = ({ data, originalDoc, operation }) => {
  if (!data) return data;
  const kind = isConnectionKind(data['kind'])
    ? data['kind']
    : isConnectionKind(originalDoc?.['kind'])
      ? originalDoc['kind']
      : 'openai';
  const info = KINDS[kind];
  const fill = (name: string, value: string | number) => {
    const sent = operation === 'create' || name in data;
    const empty = data[name] === undefined || data[name] === null || data[name] === '';
    if (sent && empty) data[name] = value;
  };
  // A model sent as a known one (a new row, or a change) brings its own rates unless the
  // save changed a rate too; the rates stay editable. The admin form posts every field, so
  // "untouched" means equal to what the row had, not absent. A refilled empty model is not a
  // change.
  const sent = typeof data['model'] === 'string' && data['model'] !== '' ? data['model'] : '';
  const known = sent && sent !== originalDoc?.['model'] ? ratesForModel(sent) : null;
  const untouched = (name: string) =>
    data[name] === undefined ||
    data[name] === null ||
    data[name] === '' ||
    data[name] === originalDoc?.[name];
  if (known && untouched('inputPerMillionUsd') && untouched('outputPerMillionUsd')) {
    data['inputPerMillionUsd'] = known.input;
    data['outputPerMillionUsd'] = known.output;
  }
  fill('model', info.defaultModel);
  fill('inputPerMillionUsd', info.rates.input);
  fill('outputPerMillionUsd', info.rates.output);
  return data;
};

/** One enabled connection per service kind, so the nightly pull never has to choose (ADR-049). */
const oneServicePerKind: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  if (!data) return data;
  const kind = data['kind'] ?? originalDoc?.['kind'];
  const enabled = (data['enabled'] ?? originalDoc?.['enabled']) !== false;
  if (!enabled || !isServiceKind(kind)) return data;
  const others = await req.payload.find({
    collection: 'connections',
    where: {
      and: [
        { kind: { equals: kind } },
        { enabled: { equals: true } },
        ...(originalDoc?.['id'] !== undefined ? [{ id: { not_equals: originalDoc['id'] } }] : []),
      ],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });
  if (others.totalDocs > 0) {
    throw new Refused(
      `One connection of the kind "${KINDS[kind as keyof typeof KINDS].label.en}" may be on at a time; switch the other off first`,
    );
  }
  return data;
};

/** The engine's connection cannot be deleted from under it: pick another first. */
const keepTheEnginesConnection: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const settings = await req.payload.findGlobal({
    slug: 'ai-settings',
    depth: 0,
    overrideAccess: true,
  });
  const current = settings.connection;
  const currentId = typeof current === 'object' && current ? current.id : current;
  if (currentId !== null && currentId !== undefined && String(currentId) === String(id)) {
    throw new Refused(
      'The content engine uses this connection; pick another in the engine settings first',
    );
  }
};

/** A sidebar field the API never writes: the test and the runs log fill it. */
function sidebarReadOnly(field: Field & { name: string }): Field {
  return {
    ...field,
    access: { create: () => false, update: () => false },
    admin: { ...field.admin, position: 'sidebar', readOnly: true },
  } as Field;
}

/**
 * The AI accounts the site calls (ADR-047): one row per key, with its model, its rates, a
 * monthly limit and a test. The content engine writes with the one its settings pick; the
 * visibility work of project 3 will read others. Admins only; the key is encrypted at rest
 * and read back as a mask. Two numbers are derived from `ai-runs` on every read, never
 * stored: what the connection has cost this month and how many runs that was.
 */
export const Connections: CollectionConfig = {
  slug: CONNECTIONS,
  labels: {
    singular: { ar: 'اتصال', en: 'Connection' },
    plural: { ar: 'الاتصالات', en: 'Connections' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'label',
    defaultColumns: ['label', 'kind', 'model', 'enabled', 'spentThisMonthUsd', 'lastTestOk'],
    listSearchableFields: ['label', 'model'],
    group: adminGroup('admin'),
    components: {
      ...collectionComponents(CONNECTIONS, { localized: false }),
      edit: {
        beforeDocumentControls: ['@/modules/connections/admin/test-action#TestConnection'],
      },
    },
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: حسابات الذكاء الاصطناعي التي يكتب بها المحرّك',
        en: 'nowhere on the site: the AI accounts the engine writes with',
      },
    },
    hidden: hiddenUnlessAdmin,
    description: {
      ar: 'حسابات الذكاء الاصطناعي: مفتاح لكل خدمة، اختبار، وحدّ إنفاق شهري. المحرّك يكتب بالاتصال المختار في إعداداته.',
      en: 'The AI accounts: one key per service, a test, and a monthly spending limit. The engine writes with the connection picked in its settings.',
    },
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: {
    beforeValidate: [fillFromKind, oneServicePerKind],
    beforeChange: [stampSavedBy],
    beforeDelete: [keepTheEnginesConnection],
  },
  fields: describeFields(
    [
      {
        name: 'label',
        type: 'text',
        required: true,
        label: { ar: 'الاسم', en: 'Name' },
      },
      {
        type: 'row',
        fields: [
          {
            name: 'kind',
            type: 'select',
            required: true,
            defaultValue: 'openai',
            options: CONNECTION_KINDS.map((value) => ({ value, label: KINDS[value].label })),
            // The mock kind is for the tests and the review server: the picker shows it, and
            // a save accepts it, only where AI_CONTENT_MOCK=1, never in production. Filtered
            // here rather than in `options`, which the generated types read: Payload
            // regenerates `payload-types.ts` on every init outside production, so a filtered
            // list would type the union by whoever ran last.
            filterOptions: ({ options }) =>
              options.filter(
                (o) => (typeof o === 'string' ? o : o.value) !== 'mock' || mockAllowed(),
              ),
            label: { ar: 'الخدمة', en: 'Service' },
          },
          {
            name: 'model',
            type: 'text',
            label: { ar: 'معرّف النموذج', en: 'Model id' },
            admin: { condition: (data) => !isServiceKind(data?.['kind']) },
          },
        ],
      },
      {
        name: 'baseUrl',
        type: 'text',
        label: { ar: 'عنوان الخدمة', en: 'Base URL' },
        admin: { condition: (data) => data?.['kind'] === 'openai-compatible' },
        validate: (
          value: unknown,
          { req, siblingData }: { req: PayloadRequest; siblingData: Record<string, unknown> },
        ) =>
          siblingData['kind'] !== 'openai-compatible' ||
          (typeof value === 'string' && HTTPS.test(value)) ||
          inLanguage(req, { ar: 'عنوان يبدأ بـ https://', en: 'An https:// address' }),
      },
      secretField(
        'apiKey',
        { ar: 'مفتاح API', en: 'API key' },
        {
          // A partial update carries no `kind`: the stored row says which.
          serviceAccountWhen: (sibling, stored) =>
            KINDS[(sibling['kind'] ?? stored?.['kind']) as keyof typeof KINDS]?.secret ===
            'serviceAccount',
        },
      ),
      {
        type: 'row',
        admin: { condition: (data) => !isServiceKind(data?.['kind']) },
        fields: [
          {
            name: 'inputPerMillionUsd',
            type: 'number',
            min: 0,
            label: {
              ar: 'سعر مليون رمز إدخال (دولار)',
              en: 'Price per million input tokens (USD)',
            },
          },
          {
            name: 'outputPerMillionUsd',
            type: 'number',
            min: 0,
            label: {
              ar: 'سعر مليون رمز إخراج (دولار)',
              en: 'Price per million output tokens (USD)',
            },
          },
          {
            name: 'monthlyLimitUsd',
            type: 'number',
            min: 0,
            label: { ar: 'الحد الشهري (دولار)', en: 'Monthly limit (USD)' },
          },
        ],
      },
      {
        name: 'enabled',
        type: 'checkbox',
        defaultValue: true,
        label: { ar: 'يعمل', en: 'On' },
        admin: {
          position: 'sidebar',
          components: { Field: '@/modules/cms/admin/fields/enabled-switch#EnabledSwitch' },
        },
      },
      sidebarReadOnly({
        name: 'spentThisMonthUsd',
        type: 'number',
        virtual: true,
        label: { ar: 'إنفاق هذا الشهر (دولار)', en: 'Spent this month (USD)' },
        hooks: {
          afterRead: [
            async ({ data, req }) => {
              const id = data?.['id'];
              return typeof id === 'number' ? (await spendFor(req, id)).spentUsd : 0;
            },
          ],
        },
      }),
      sidebarReadOnly({
        name: 'callsThisMonth',
        type: 'number',
        virtual: true,
        label: { ar: 'تشغيلات هذا الشهر', en: 'Runs this month' },
        hooks: {
          afterRead: [
            async ({ data, req }) => {
              const id = data?.['id'];
              return typeof id === 'number' ? (await spendFor(req, id)).calls : 0;
            },
          ],
        },
      }),
      sidebarReadOnly({
        name: 'lastTestAt',
        type: 'date',
        label: { ar: 'آخر اختبار', en: 'Last test' },
        admin: { date: { pickerAppearance: 'dayAndTime' } },
      }),
      sidebarReadOnly({
        name: 'lastTestOk',
        type: 'checkbox',
        label: { ar: 'نجح آخر اختبار', en: 'Last test passed' },
      }),
      sidebarReadOnly({
        name: 'lastTestMessage',
        type: 'text',
        label: { ar: 'نتيجة آخر اختبار', en: 'Last test result' },
      }),
      savedByField,
    ],
    CONNECTION_DESCRIPTIONS,
  ),
};
