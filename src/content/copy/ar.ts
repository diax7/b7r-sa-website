import { ERROR_PAGE } from '@/content/copy/error-page';

/**
 * The Arabic interface copy (BRD 4, Appendix G; ADR-031, ADR-043): every string the code
 * owns, in one bank; the CMS holds the content. `tests/content-verbatim` checks it against
 * the BRD copy bank. This bank defines the shape (`SiteCopy = typeof ar`); the English one
 * in `en.ts` must match it key for key.
 */
export const ar = {
  a11y: {
    skipToContent: 'تخطَّ إلى المحتوى',
    mainNavigation: 'التنقل الرئيسي',
    footerNavigation: 'روابط التذييل',
    homeLink: 'بحر برنت، الرئيسية',
    close: 'إغلاق',
    loading: 'جارٍ التحميل',
    /** The language switch: named in the target language, described in this one. */
    switchLanguage: 'انتقل إلى النسخة الإنجليزية',
  },
  hero: {
    carouselLabel: 'شرائح العرض الرئيسية',
    slideIndicator: 'الشريحة {n} من {total}',
    pause: 'إيقاف التبديل التلقائي',
    resume: 'استئناف التبديل التلقائي',
  },
  designer: {
    canvasLabel: 'معاينة التصميم على المنتج',
    productGroupLabel: 'اختر المنتج',
    colorGroupLabel: 'اختر اللون',
    colorOption: 'اللون {color}',
    sellPriceInput: 'سعر البيع بالريال',
    sellPriceSlider: 'سعر البيع',
    dailySalesDecrement: 'أنقص المبيعات اليومية',
    dailySalesIncrement: 'زد المبيعات اليومية',
    designThumbnail: 'التصميم الحالي',
    dropzoneLabel: 'ارفع ملف التصميم',
    productGroup: 'المنتج',
    uploadPrompt: 'اضغط لرفع شعارك أو صورتك',
    remove: 'إزالة التصميم',
    canvasHint: 'اسحب التصميم لتحريكه، واستخدم الزوايا لتغيير الحجم.',
    baseCost: 'التكلفة من بحر',
    sellPrice: 'سعر البيع في متجرك',
    suggestedPrice: 'السعر المقترح',
    dailySales: 'مبيعات يومية',
    perPiece: 'ربحك لكل قطعة',
    monthly: 'ربحك الشهري التقديري',
    negativeWarning: 'سعر البيع أقل من التكلفة. ارفع السعر لتربح.',
    fileError: 'الملف غير مدعوم أو أكبر من 10 ميجابايت.',
    mockupAlt: '{product} {color}، الواجهة الأمامية',
  },
  strip: {
    label: 'المنتجات المتاحة',
    swipeHint: 'اسحب',
  },
  gallery: {
    label: 'صور المنتج',
    flip: 'اقلب الصورة',
    front: 'الواجهة الأمامية',
    back: 'الواجهة الخلفية',
  },
  breadcrumbs: {
    label: 'مسار الصفحة',
  },
  // The comparison block's fixed words (BRD 4.18, ADR-050).
  compare: {
    caption: 'مقارنة بين {ours} و{theirs}',
    criterion: 'المعيار',
    bestFor: 'الأنسب لك {ours} إذا كنت',
    notBestFor: 'ليس {ours} الأنسب إذا كنت',
    asOf: 'قُرئت صفحات {theirs} في',
    asOfTail: '؛ الأرقام تتغير، وتاريخ القراءة يبقى صادقاً.',
  },
  faq: {
    groupsNav: 'أقسام الأسئلة',
    /** The group names as the page shows them; the select values (Appendix D) are the keys. */
    groups: {
      البداية: 'البداية',
      'الأسعار والربح': 'الأسعار والربح',
      'الطلبات والتوصيل': 'الطلبات والتوصيل',
      'المتاجر والربط': 'المتاجر والربط',
      'الجودة والدعم': 'الجودة والدعم',
    },
  },
  legal: {
    onThisPage: 'في هذه الصفحة',
    updatedPrefix: 'آخر تحديث:',
  },
  share: {
    whatsapp: 'شارك على واتساب',
    x: 'شارك على X',
    copy: 'انسخ الرابط',
  },
  testimonials: {
    placeholderTag: 'نموذج',
  },
  integrations: {
    availableTag: 'متاح الآن',
    tileAria: 'ربط متجر {platform}',
  },
  productsPage: {
    title: 'المنتجات',
    lead: 'منتجات بجودة عالية، تُطبع عند الطلب وتُشحن باسم متجرك.',
    pricePrefix: 'يبدأ من',
    breadcrumbHome: 'الرئيسية',
    priceBlock: {
      cost: 'التكلفة تبدأ من',
      suggested: 'سعر بيع مقترح',
      profit: 'ربحك التقديري',
      perPiece: 'لكل قطعة',
    },
    primaryCta: 'ابدأ بيع هذا المنتج',
    secondaryLink: 'جرّب تصميمك عليه',
    sections: {
      specs: 'المواصفات',
      sizeChart: 'جدول المقاسات',
      related: 'منتجات أخرى',
    },
    specLabels: {
      material: 'الخامة',
      weight: 'الوزن',
      sizes: 'المقاسات',
      colors: 'الألوان',
      printArea: 'منطقة الطباعة',
      printMethod: 'طريقة الطباعة',
    },
    weightUnit: 'غم',
    /** Between the sizes and the colours in the spec list. */
    listSeparator: '، ',
    sizeChartHeaders: { size: 'المقاس', length: 'الطول', chest: 'عرض الصدر', sleeve: 'طول الكم' },
    colorSwitchAria: 'اللون {colour}',
  },
  contactForm: {
    labels: {
      name: 'الاسم',
      phone: 'رقم الجوال',
      email: 'البريد الإلكتروني',
      inquiry: 'نوع الاستفسار',
      message: 'رسالتك',
    },
    placeholders: {
      name: 'اسمك الكامل',
      phone: '05XXXXXXXX',
      email: 'name@example.com',
      message: 'اكتب رسالتك هنا',
    },
    inquiryOptions: ['تاجر', 'شراكة', 'استثمار', 'أخرى'],
    submit: 'أرسل الرسالة',
    sending: 'جارٍ الإرسال',
    success: 'وصلتنا رسالتك. سنرد عليك قريباً.',
    /** Secondary link on the success card (BRD 6.9). */
    successWhatsapp: 'راسلنا على واتساب',
    failure: 'تعذّر الإرسال. حاول مرة أخرى أو راسلنا على واتساب.',
    validation: {
      name: 'أدخل اسمك',
      phone: 'أدخل رقم جوال صحيح',
      email: 'أدخل بريداً إلكترونياً صحيحاً',
      message: 'اكتب رسالتك',
    },
  },
  contactEmail: {
    subject: 'رسالة جديدة من الموقع: {inquiryType}',
    replyOnWhatsapp: 'رد عبر واتساب',
  },
  notFoundPage: {
    title: 'الصفحة غير موجودة',
    text: 'يبدو أن الرابط تغيّر أو حُذف.',
    button: 'العودة للرئيسية',
  },
  footer: {
    linksTitle: 'روابط',
    policiesTitle: 'السياسات',
    newsletterTitle: 'النشرة البريدية',
    newsletterLabel: 'اشترك ليصلك الجديد',
    newsletterPlaceholder: 'name@example.com',
    newsletterButton: 'اشترك',
    newsletterSuccess: 'اشتركت. سنرسل لك الجديد فقط.',
    newsletterError: 'أدخل بريداً إلكترونياً صحيحاً.',
    newsletterUnavailable: 'تعذّر الاشتراك الآن، حاول لاحقاً.',
    socialAria: {
      x: 'بحر برنت على X',
      instagram: 'بحر برنت على إنستغرام',
      tiktok: 'بحر برنت على تيك توك',
      whatsapp: 'بحر برنت على واتساب',
    },
    badgesCaption: 'وسائل الدفع وجهات التوثيق',
    copyright: '© {year} بحر برنت. جميع الحقوق محفوظة.',
  },
  draftBar: {
    label: 'معاينة مسودة: ما تراه هنا لم يُنشر بعد.',
    exit: 'خروج من المعاينة',
  },
  whatsappWidget: {
    buttonAria: 'تواصل معنا عبر واتساب',
    title: 'بحر برنت',
    subtitle: 'فريق الدعم',
    greeting: 'أهلاً 👋 كيف نقدر نساعدك؟',
    action: 'ابدأ المحادثة',
    prefilled: 'مرحباً، أرغب بمعرفة المزيد عن بحر برنت.',
    closeAria: 'إغلاق',
  },
  consent: {
    text: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس أداء الموقع.',
    accept: 'موافق',
    reject: 'رفض',
    link: 'سياسة الخصوصية',
  },
  errorPage: ERROR_PAGE.ar,
  gonePage: {
    title: 'هذه الصفحة أُزيلت',
    text: 'يبدو أن الرابط تغيّر أو حُذف.',
    button: 'العودة للرئيسية',
  },
  blog: {
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
    allHubs: 'الكل',
    emptyHub: 'لا مقالات في هذا القسم بعد.',
    copied: 'نُسخ الرابط',
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
  },
  seo: {
    titleTemplate: '%s | بحر برنت',
    product: {
      title: '{name} للطباعة عند الطلب',
      description:
        '{short description}. التكلفة تبدأ من {base} ريالاً، بدون حد أدنى، وشحن باسم متجرك.',
    },
    merchantCostNote: 'تكلفة للتاجر',
  },
  readingTime: {
    one: 'دقيقة قراءة',
    two: 'دقيقتا قراءة',
    few: '{n} دقائق قراءة',
    many: '{n} دقيقة قراءة',
  },
  media: {
    videoPosterAlt: 'طابعة رقمية تطبع تصميماً على تيشيرت أسود',
    trustBadges: {
      saudiBusinessCenter: 'المركز السعودي للأعمال',
      ministryOfCommerce: 'وزارة التجارة',
      misk: 'مؤسسة مسك',
    },
    sarAria: 'ريال سعودي',
  },
  /** `/llms.txt` (BRD 7.10, ADR-043): the map of the site for answer engines. */
  llms: {
    intro:
      '{brand} منصة طباعة عند الطلب في السعودية: التاجر يبيع تصميمه في متجره على سلة أو زد أو شوبيفاي، ونحن نطبع القطعة في {origin} ونشحنها باسم متجره خلال {days} أيام كحد أقصى داخل المملكة. لا مخزون ولا حد أدنى، والحساب مجاني برصيد ترحيبي {credit} ريالاً.',
    pages: 'الصفحات',
    products: 'المنتجات (التكلفة للتاجر والسعر المقترح بالريال السعودي)',
    productLine: '{description} التكلفة {cost} ريالاً، السعر المقترح {price} ريالاً.',
    blog: 'المدونة',
    otherLanguages: 'لغات أخرى',
    otherLanguage: 'النسخة الإنجليزية',
  },
  /** The `Intl` tag for dates: Gregorian, Western digits (BRD 3.9). */
  dateLocale: 'ar-u-nu-latn-ca-gregory',
};
