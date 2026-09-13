import type { CollectionConfig } from 'payload';
import { passwordProblem } from '@/lib/pwned';
import { adminField, isAdmin, isAdminOrSelf } from '@/modules/cms/access';

const LOCK_MINUTES = 15;

/** Rejects a password that is too short or breached; runs on create, update and reset. */
async function enforcePasswordPolicy(data: Record<string, unknown> | undefined) {
  const password = data?.['password'];
  if (typeof password !== 'string') return;
  const problem = await passwordProblem(password);
  if (problem === 'too_short') {
    throw new Error('كلمة المرور قصيرة: 12 حرفاً على الأقل.');
  }
  if (problem === 'breached') {
    throw new Error('كلمة المرور ظهرت في تسريبات معروفة، اختر كلمة أخرى.');
  }
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
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: { ar: 'الإدارة', en: 'Administration' },
  },
  access: {
    admin: ({ req }) => Boolean(req.user),
    read: isAdminOrSelf,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [({ data }) => enforcePasswordPolicy(data).then(() => data)],
    beforeChange: [({ data }) => enforcePasswordPolicy(data).then(() => data)],
  },
  fields: [
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
      admin: {
        description: {
          ar: 'المدير يملك كل الصلاحيات. المحرر يعدّل المحتوى فقط ولا يرى المستخدمين أو الإعدادات.',
          en: 'Admins can do everything; editors edit content only.',
        },
      },
    },
  ],
};
