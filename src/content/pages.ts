/** Page copy for BRD 4.9–4.12 and 4.15 (built in Phase 1c; strings live here from 1a). */

export const howItWorksPage = {
  title: 'كيف تعمل الطباعة عند الطلب مع بحر؟',
  lead: 'نموذج عمل يتيح لك بيع منتجات مخصصة دون أن تطبعها أو تخزنها.',
  profitTitle: 'كيف تُحسب أرباحك؟',
  equation: { sell: 'سعر البيع', base: 'التكلفة الأساسية', profit: 'ربحك' },
  exampleLine: 'مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة.',
};

export const aboutPage = {
  title: 'من نحن',
  storyTitle: 'حكاية بدأت بتحدٍّ وتحوّلت إلى فرصة',
  story:
    'وُلدت بحر برنت من تجربة مصمم حاول إطلاق علامته التجارية، فاصطدم بتكاليف مرتفعة وتعقيدات لوجستية عطّلت حلمه. تحوّل التحدي إلى فرصة لبناء حل محلي يفتح الباب لكل مبدع ورائد أعمال ليطلق منتجاته بأقل التكاليف. اليوم، بحر برنت منصة سعودية متكاملة تمكّن المؤثرين والمصممين وأصحاب الأفكار من تحويل إبداعاتهم إلى منتجات حقيقية تصل إلى عملائهم بسهولة واحترافية.',
  cards: [
    {
      icon: 'Target',
      title: 'رسالتنا',
      text: 'تمكين أي شخص من إطلاق علامته التجارية بسهولة، عبر خدمة محلية للطباعة عند الطلب تشمل المنتجات والطباعة والتغليف والشحن، مع ربط ذكي بمتجره.',
    },
    {
      icon: 'Eye',
      title: 'رؤيتنا',
      text: 'أن نكون الشريك الأول للمبدعين ورواد الأعمال في السعودية والخليج لإطلاق منتجاتهم المطبوعة، وأن نسهم في اقتصاد إبداعي مستدام يقوم على حلول تقنية محلية.',
    },
    {
      icon: 'Heart',
      title: 'قيمنا',
      text: 'الإبداع الذي يحوّل الأفكار إلى منتجات، والتمكين الذي يمنح كل مبدع بداية بلا مخاطرة، والجودة التي نلتزم بها في الطباعة والتغليف.',
    },
  ],
  miskTitle: 'خريجو برنامج Misk Launchpad',
  miskText:
    'بحر برنت من خريجي الدفعة التاسعة (2026) من برنامج Misk Launchpad، برنامج ما قبل التسريع من مؤسسة محمد بن سلمان «مسك».',
  locationLine: 'نطبع ونشحن من جدة إلى كل مدن المملكة.',
};

export const contactPage = {
  title: 'تواصل معنا',
  lead: 'تاجر، شريك، أو مستثمر؟ نرد على الجميع.',
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
  failure: 'تعذّر الإرسال. حاول مرة أخرى أو راسلنا على واتساب.',
  validation: {
    name: 'أدخل اسمك',
    phone: 'أدخل رقم جوال صحيح',
    email: 'أدخل بريداً إلكترونياً صحيحاً',
    message: 'اكتب رسالتك',
  },
  cards: {
    whatsapp: { title: 'واتساب', text: 'راسلنا مباشرة' },
    email: { title: 'البريد الإلكتروني' },
    phone: { title: 'الهاتف' },
    follow: { title: 'تابعنا' },
  },
  booking: {
    title: 'احجز استشارة مجانية',
    text: '30 دقيقة نجاوب فيها على أسئلتك ونساعدك تبدأ.',
    button: 'احجز موعدك',
    whatsappMessage: 'مرحباً، أرغب بحجز استشارة مجانية.',
  },
};

export const faqPage = {
  title: 'الأسئلة الشائعة',
  lead: 'كل ما تحتاج معرفته قبل أن تبدأ.',
  bottomLine: 'لم تجد إجابتك؟ راسلنا على واتساب.',
};

export const notFoundPage = {
  title: 'الصفحة غير موجودة',
  text: 'يبدو أن الرابط تغيّر أو حُذف.',
  button: 'العودة للرئيسية',
};

export const legalCopy = {
  updatedPrefix: 'آخر تحديث:',
};

export const footerCopy = {
  linksTitle: 'روابط',
  policiesTitle: 'السياسات',
  newsletterTitle: 'النشرة البريدية',
  newsletterLabel: 'اشترك ليصلك الجديد',
  newsletterPlaceholder: 'name@example.com',
  newsletterButton: 'اشترك',
  newsletterSuccess: 'اشتركت. سنرسل لك الجديد فقط.',
  newsletterError: 'أدخل بريداً إلكترونياً صحيحاً.',
  socialAria: {
    x: 'بحر برنت على X',
    instagram: 'بحر برنت على إنستغرام',
    tiktok: 'بحر برنت على تيك توك',
  },
  badgesCaption: 'وسائل الدفع وجهات التوثيق',
  miskLine: 'خريجو برنامج Misk Launchpad، الدفعة 9، 2026',
  copyright: '© {year} بحر برنت. جميع الحقوق محفوظة.',
};

export const whatsappWidgetCopy = {
  buttonAria: 'تواصل معنا عبر واتساب',
  title: 'بحر برنت',
  subtitle: 'فريق الدعم',
  greeting: 'أهلاً 👋 كيف نقدر نساعدك؟',
  action: 'ابدأ المحادثة',
  prefilled: 'مرحباً، أرغب بمعرفة المزيد عن بحر برنت.',
  closeAria: 'إغلاق',
};

export const consentCopy = {
  text: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس أداء الموقع.',
  accept: 'موافق',
  reject: 'رفض',
  link: 'سياسة الخصوصية',
};

/** Not in BRD 4; written per 4.1 for the runtime error pages (BRD 8.11). */
export const errorPage = {
  // TODO(copy): review with Dhia (plan §D)
  title: 'حدث خطأ غير متوقع',
  // TODO(copy): review with Dhia (plan §D)
  text: 'حاول تحديث الصفحة، أو راسلنا على واتساب.',
  button: 'العودة للرئيسية',
};

/** Preview-only developer label for sections that Phase 1b builds (plan §H). */
export const placeholderCopy = {
  // TODO(copy): developer label, never shown on b7r.sa
  label: 'يُبنى في المرحلة 1b',
};
