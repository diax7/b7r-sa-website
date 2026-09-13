/**
 * The shell's interface strings (ADR-031: interface copy is ours, written under the ux-araby
 * rules in docs/ADMIN-DESIGN-SYSTEM.md §5). Payload's own strings come from its `ar` pack.
 */
export const adminStrings = {
  nav: {
    label: 'القائمة الرئيسية',
    brand: 'لوحة بحر برنت',
    search: 'ابحث أو انتقل…',
    viewSite: 'عرض الموقع',
    closeMenu: 'إغلاق القائمة',
    groupToggle: 'طيّ المجموعة أو فتحها',
  },
  account: {
    menu: 'قائمة الحساب',
    profile: 'حسابي',
    logout: 'تسجيل الخروج',
    roles: { admin: 'مدير', editor: 'محرّر' } as Record<string, string>,
  },
  palette: {
    title: 'انتقل إلى…',
    placeholder: 'اكتب اسم قسم أو عنوان صفحة أو منتج',
    hint: 'اكتب حرفين على الأقل للبحث في المحتوى',
    sections: 'الأقسام',
    results: 'المحتوى',
    empty: 'لا نتائج لهذا البحث.',
    open: 'فتح',
    shortcut: 'اضغط Ctrl K في أي وقت',
    searching: 'يبحث…',
  },
  login: {
    noAccount: 'لا تملك حساباً؟ اطلبه من مدير الموقع.',
  },
} as const;
