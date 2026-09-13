import { type CollectionConfig, type PayloadRequest, ValidationError } from 'payload';
import { passwordProblem } from '@/lib/pwned';
import { adminField, isAdmin, isAdminOrSelf } from '@/modules/cms/access';

const LOCK_MINUTES = 15;

const PASSWORD_MESSAGES = {
  too_short: 'كلمة المرور قصيرة: 12 حرفاً على الأقل.',
  breached: 'كلمة المرور ظهرت في تسريبات معروفة، اختر كلمة أخرى.',
} as const;

/**
 * Rejects a password that is too short or breached (ADR-027) as a field-level validation
 * error (HTTP 400, shown inline in the admin). `beforeValidate` is the one hook every path
 * runs: create, update and Payload's reset-password operation.
 */
async function enforcePasswordPolicy(
  data: Record<string, unknown> | undefined,
  req: PayloadRequest,
): Promise<void> {
  const password = data?.['password'];
  if (typeof password !== 'string') return;
  const problem = await passwordProblem(password);
  if (!problem) return;
  throw new ValidationError({
    collection: 'users',
    errors: [{ path: 'password', message: PASSWORD_MESSAGES[problem] }],
    req,
  });
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
    beforeValidate: [({ data, req }) => enforcePasswordPolicy(data, req).then(() => data)],
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
