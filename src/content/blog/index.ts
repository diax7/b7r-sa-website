/**
 * The blog's interface copy (BRD 4.13, 6.11; ADR-031): the strings around the posts. The
 * posts, hubs and authors live in the CMS (ADR-041); their seed is `content/seed/blog.ts`.
 */
export const blogCopy = {
  title: 'مدونة بحر',
  lead: 'أدلة عملية لبدء براندك وبيع منتجاتك المطبوعة في السعودية.',
  metaTemplate: 'كتبه ضياء · {date} · {n} دقائق قراءة',
  takeawaysTitle: 'أهم النقاط',
  relatedTitle: 'مقالات ذات صلة',
  share: 'شارك',
  inPostCta: {
    title: 'ابدأ براندك اليوم',
    text: 'بدون رأس مال وبدون مخزون.',
    button: 'ابدأ براندك مجانًا',
  },
  author: { name: 'ضياء', role: 'مؤسس بحر برنت' },
  // TODO(copy): not in BRD 4.13; listed in Appendix G for Dhia
  allHubs: 'الكل',
  // TODO(copy): not in BRD 4.13; listed in Appendix G for Dhia
  emptyHub: 'لا مقالات في هذا القسم بعد.',
  // TODO(copy): not in BRD 4.13 (plan 1c §D; «تم النسخ» avoided per 4.1)
  copied: 'نُسخ الرابط',
  // TODO(copy): Level 3 template strings (BRD 10.1), listed in Appendix G for Dhia
  toc: 'في هذا المقال',
  updatedPrefix: 'حُدّث',
  previousPost: 'المقال السابق',
  nextPost: 'المقال التالي',
  featured: 'أحدث مقال',
  latest: 'أحدث المقالات',
  search: {
    label: 'ابحث في المدونة',
    placeholder: 'اكتب كلمة من العنوان',
    results: 'نتائج البحث',
    empty: 'لا نتائج. جرّب كلمة أخرى.',
    clear: 'مسح',
  },
  pagination: {
    label: 'صفحات المدونة',
    page: 'صفحة {n}',
    previous: 'الأحدث',
    next: 'الأقدم',
  },
  hubIntro: 'كل مقالات قسم {hub}',
  authorIntro: 'كل ما كتبه {name}',
  authorPosts: 'مقالاته',
} as const;
