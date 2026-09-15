import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
} from 'payload';
import { hiddenUnlessAdmin, isAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { savedByField, stampSavedBy } from '@/modules/cms/fields/saved-by';
import { secretField } from '@/modules/cms/fields/secret-field';
import { Refused } from '@/modules/cms/refused';
import { CONNECTION_DESCRIPTIONS } from '@/modules/connections/descriptions';
import { CONNECTION_KINDS, isConnectionKind, KINDS } from '@/modules/connections/kinds';
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
  fill('model', info.defaultModel);
  fill('inputPerMillionUsd', info.rates.input);
  fill('outputPerMillionUsd', info.rates.output);
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
    beforeValidate: [fillFromKind],
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
            label: { ar: 'الخدمة', en: 'Service' },
          },
          {
            name: 'model',
            type: 'text',
            label: { ar: 'معرّف النموذج', en: 'Model id' },
          },
        ],
      },
      {
        name: 'baseUrl',
        type: 'text',
        label: { ar: 'عنوان الخدمة', en: 'Base URL' },
        admin: { condition: (data) => data?.['kind'] === 'openai-compatible' },
        validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
          siblingData['kind'] !== 'openai-compatible' ||
          (typeof value === 'string' && HTTPS.test(value)) ||
          'An https:// address',
      },
      secretField('apiKey', { ar: 'مفتاح API', en: 'API key' }),
      {
        type: 'row',
        fields: [
          {
            name: 'inputPerMillionUsd',
            type: 'number',
            min: 0,
            label: { ar: 'سعر المليون رمز داخل (دولار)', en: 'Input USD per 1M tokens' },
          },
          {
            name: 'outputPerMillionUsd',
            type: 'number',
            min: 0,
            label: { ar: 'سعر المليون رمز خارج (دولار)', en: 'Output USD per 1M tokens' },
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
        label: { ar: 'نتيجة آخر اختبار', en: 'Last test said' },
      }),
      savedByField,
    ],
    CONNECTION_DESCRIPTIONS,
  ),
};
