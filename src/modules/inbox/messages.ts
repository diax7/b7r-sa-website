import type { CollectionConfig, Field } from 'payload';
import { isAdmin, isEditorOrAdmin } from '@/modules/cms/access';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup, sectionIcon } from '@/modules/cms/admin/icons';
import { STATUS_CELL } from '@/modules/cms/fields/status';
import { MESSAGE_DESCRIPTIONS } from '@/modules/inbox/descriptions';

export const MESSAGES = 'messages' as const;

export const MESSAGE_STATUSES = ['new', 'following', 'handled'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

/** A message's state, as the inbox reads it: three glossary rows, one pill each (ADR-061). */
export const MESSAGE_STATUS_LABELS: Record<MessageStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  following: { ar: 'قيد المتابعة', en: 'Following' },
  handled: { ar: 'معالَج', en: 'Handled' },
};

const never = () => false;

/**
 * A field the form sent: shown as a line, never rewritten by anyone (ADR-061's personal-data
 * rule). The refusal is field-level `access.update`, which Payload answers by dropping the
 * value from the write, so a PATCH that names the phone keeps the phone the sender typed;
 * the contact route creates the row with access overridden.
 */
function sent(field: Field & { name: string }): Field {
  return {
    ...field,
    access: { update: never },
    admin: { ...field.admin, readOnly: true },
  } as Field;
}

/**
 * The inbox (ADR-061): one row per contact form submission, written by `/api/contact`
 * through the Local API before the notification e-mail leaves (the row is the record, the
 * e-mail a copy), read and worked by admins and editors (the status and the internal notes
 * are the two fields anyone writes), deleted by an admin only, never created through the
 * API. The first collection holding a stranger's name, phone and e-mail: no personal field
 * reaches a log line, and nothing is deleted automatically.
 */
export const Messages: CollectionConfig = {
  slug: MESSAGES,
  labels: {
    singular: { ar: 'رسالة', en: 'Message' },
    plural: { ar: 'الرسائل', en: 'Messages' },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'inquiry', 'status', 'createdAt'],
    listSearchableFields: ['name', 'email', 'phone'],
    group: adminGroup('site'),
    components: collectionComponents(MESSAGES, {
      beforeDocumentControls: ['@/modules/inbox/admin/message-actions#MessageActions'],
    }),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: ما يرسله نموذج التواصل',
        en: 'nowhere on the site: what the contact form sends',
      },
    },
    description: {
      ar: 'رسائل نموذج التواصل كما وصلت: حالة لكل رسالة وملاحظات داخلية. لا يُنشئها أحد يدوياً.',
      en: 'What the contact form sent, as it arrived: a status per message and internal notes. Nobody creates one by hand.',
    },
  },
  access: { read: isEditorOrAdmin, create: never, update: isEditorOrAdmin, delete: isAdmin },
  defaultSort: '-createdAt',
  fields: describeFields(
    [
      sent({ name: 'name', type: 'text', required: true, label: { ar: 'الاسم', en: 'Name' } }),
      {
        type: 'row',
        fields: [
          sent({ name: 'phone', type: 'text', label: { ar: 'رقم الجوال', en: 'Phone' } }),
          sent({
            name: 'email',
            type: 'email',
            required: true,
            label: { ar: 'البريد الإلكتروني', en: 'E-mail' },
          }),
        ],
      },
      {
        type: 'row',
        fields: [
          sent({
            name: 'inquiry',
            type: 'text',
            required: true,
            label: { ar: 'نوع الاستفسار', en: 'Inquiry' },
          }),
          sent({
            name: 'locale',
            type: 'select',
            required: true,
            defaultValue: 'ar',
            options: [
              { value: 'ar', label: { ar: 'العربية', en: 'Arabic' } },
              { value: 'en', label: { ar: 'الإنجليزية', en: 'English' } },
            ],
            label: { ar: 'لغة النموذج', en: 'Form language' },
          }),
        ],
      },
      sent({
        name: 'message',
        type: 'textarea',
        required: true,
        label: { ar: 'الرسالة', en: 'Message' },
      }),
      {
        name: 'notes',
        type: 'textarea',
        label: { ar: 'ملاحظات داخلية', en: 'Internal notes' },
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        // The sidebar's badge and the dashboard card count `new` on every render.
        index: true,
        defaultValue: 'new',
        options: MESSAGE_STATUSES.map((value) => ({ value, label: MESSAGE_STATUS_LABELS[value] })),
        label: { ar: 'الحالة', en: 'Status' },
        admin: { position: 'sidebar', components: { Cell: STATUS_CELL } },
      },
      sent({
        name: 'emailed',
        type: 'checkbox',
        defaultValue: false,
        label: { ar: 'أُرسل التنبيه', en: 'Notification sent' },
        admin: { position: 'sidebar' },
      }),
      sent({
        name: 'page',
        type: 'text',
        label: { ar: 'الصفحة', en: 'Page' },
        admin: { position: 'sidebar' },
      }),
      {
        name: 'utm',
        type: 'group',
        label: { ar: 'UTM', en: 'UTM' },
        admin: { position: 'sidebar', ...sectionIcon('utm') },
        fields: [
          sent({ name: 'source', type: 'text', label: { ar: 'المصدر', en: 'Source' } }),
          sent({ name: 'medium', type: 'text', label: { ar: 'الوسيط', en: 'Medium' } }),
          sent({ name: 'campaign', type: 'text', label: { ar: 'الحملة', en: 'Campaign' } }),
        ],
      },
    ],
    MESSAGE_DESCRIPTIONS,
  ),
};
