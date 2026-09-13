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
  dashboard: {
    greeting: 'مرحباً، {name}',
    intro: 'كل شيء في الموقع يبدأ من هنا.',
    quick: 'ابدأ من هنا',
    actions: {
      home: { title: 'الصفحة الرئيسية', text: 'عدّل الأقسام وانشر' },
      addPage: { title: 'أضف صفحة', text: 'صفحة جديدة برابطها' },
      addProduct: { title: 'أضف منتجاً', text: 'أسعار وصور ومقاسات' },
      addFaq: { title: 'أضف سؤالاً', text: 'سؤال جديد في الأسئلة الشائعة' },
      media: { title: 'ارفع ملفاً', text: 'صورة أو ملف للصفحات' },
      site: { title: 'عرض الموقع', text: 'كما يراه الزائر' },
    },
    health: {
      title: 'حالة النظام',
      check: 'التقرير الكامل',
      version: 'الإصدار',
      rows: {
        db: { ok: 'قاعدة البيانات تعمل', error: 'قاعدة البيانات لا تجيب' },
        jobs: { on: 'المهام المجدولة تعمل', off: 'المهام المجدولة لم تبدأ بعد' },
        jobsFailed: {
          none: 'لا مهام فاشلة',
          some: '{n} مهام فاشلة',
          unknown: 'حالة المهام غير معروفة',
        },
        email: { resend: 'البريد يُرسل عبر Resend', console: 'البريد يُطبع في السجل، بلا مزوّد' },
        turnstile: { on: 'التحقق من الروبوتات مفعّل', off: 'التحقق من الروبوتات متوقف' },
        indexnow: { on: 'إشعار محركات البحث مفعّل', off: 'إشعار محركات البحث متوقف' },
        media: { s3: 'الوسائط على التخزين السحابي', local: 'الوسائط على قرص الخادم' },
        contact: {
          live: 'نموذج التواصل يرسل',
          mock: 'نموذج التواصل تجريبي',
          off: 'نموذج التواصل متوقف',
        },
        newsletter: { live: 'النشرة تسجّل المشتركين', mock: 'النشرة تجريبية', off: 'النشرة متوقفة' },
      },
    },
    recent: {
      title: 'آخر التعديلات',
      empty: 'لا تعديلات بعد. ابدأ من الصفحة الرئيسية.',
      by: 'بواسطة {name}',
      draft: 'مسودة',
      published: 'منشور',
    },
  },
} as const;
