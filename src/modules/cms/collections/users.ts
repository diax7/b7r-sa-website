import type { CollectionConfig } from 'payload';
import { passwordProblem } from '@/lib/pwned';
import { adminField, isAdmin, isAdminOrSelf } from '@/modules/cms/access';
import { gateLogin } from '@/modules/cms/auth/login-gate';
import { generateResetHtml, generateResetSubject } from '@/modules/cms/auth/reset-email';
import { Refused } from '@/modules/cms/refused';
import { collectionComponents } from '@/modules/cms/admin/document/config';
import { adminGroup } from '@/modules/cms/admin/icons';
import { USER_DESCRIPTIONS } from '@/modules/cms/admin/descriptions/site';
import { describeFields } from '@/modules/cms/admin/descriptions/describe';

const LOCK_MINUTES = 15;

const PASSWORD_MESSAGES = {
  too_short: 'The password is too short: at least 8 characters.',
  breached: 'That password appears in known breaches; choose another.',
} as const;

/**
 * Rejects a password that is too short or breached (ADR-027) with HTTP 400 and the Arabic
 * reason as the response message (`Refused`, ADR-031).
 * `beforeValidate` is the one hook every path runs: create, update and Payload's
 * reset-password operation.
 */
async function enforcePasswordPolicy(data: Record<string, unknown> | undefined): Promise<void> {
  const password = data?.['password'];
  if (typeof password !== 'string') return;
  const problem = await passwordProblem(password);
  if (!problem) return;
  throw new Refused(PASSWORD_MESSAGES[problem]);
}

/** Admin users (BRD 9.3): admin | editor, lockout 5/15 min, hardened cookies. */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: { ar: 'مستخدم', en: 'User' }, plural: { ar: 'المستخدمون', en: 'Users' } },
  auth: {
    maxLoginAttempts: 5,
    lockTime: LOCK_MINUTES * 60 * 1000,
    tokenExpiration: 60 * 60 * 8,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
    // The Arabic reset e-mail (ADR-034); sent through Resend when configured.
    forgotPassword: {
      generateEmailSubject: generateResetSubject,
      generateEmailHTML: generateResetHtml,
    },
  },
  admin: {
    hideAPIURL: true,
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    listSearchableFields: ['name', 'email'],
    group: adminGroup('admin'),
    components: collectionComponents('users', { localized: false }),
    custom: {
      shows: {
        ar: 'لا يظهر في الموقع: من يسجّل الدخول هنا وما يُسمح له بتغييره',
        en: 'nowhere on the site: who can sign in here and what they may change',
      },
    },
    description: {
      ar: 'حسابات لوحة التحكم. المحرّر يعدّل المحتوى؛ المدير يعدّل الإعدادات والمستخدمين.',
      en: 'Panel accounts. Editors change content; admins also change settings and users.',
    },
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    // The login gate runs before the password check and the attempt counter (ADR-034).
    beforeOperation: [gateLogin],
    beforeValidate: [({ data }) => enforcePasswordPolicy(data).then(() => data)],
  },
  fields: describeFields(
    [
      {
        name: 'name',
        type: 'text',
        required: true,
        label: { ar: 'الاسم', en: 'Name' },
      },
      {
        name: 'role',
        type: 'select',
        required: true,
        defaultValue: 'editor',
        saveToJWT: true,
        label: { ar: 'الدور', en: 'Role' },
        options: [
          { label: { ar: 'مدير', en: 'Admin' }, value: 'admin' },
          { label: { ar: 'محرر', en: 'Editor' }, value: 'editor' },
        ],
        access: { update: adminField },
      },
    ],
    USER_DESCRIPTIONS,
  ),
};
