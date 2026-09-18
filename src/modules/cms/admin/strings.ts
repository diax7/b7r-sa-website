import { rtlLanguages } from '@payloadcms/translations';

/**
 * The shell's interface strings (ADR-031: interface copy is ours), in the panel's two
 * languages (ADR-056). `adminStrings` is the English tree and the shape; `adminStringsAr`
 * is the Arabic tree, typed against it, so a string added in one language without the other
 * is a type error and `tests/admin-strings.test.ts` reads the Arabic under the ux-araby
 * rules. A component picks its tree per render with `adminStringsFor(i18n.language)` on the
 * server or `useAdminStrings()` on the client, never at module top level: the language is
 * the request's, not the build's.
 *
 * Two axes that never share a control: the UI language (Payload's `i18n`, the account view's
 * language select, the `payload-lng` cookie) decides which of these trees renders; the
 * content locale (the AR / EN pills, `html[data-content-locale]`, `?locale=`) decides which
 * language of a document is being edited. `locale.editing` below is keyed by the content
 * locale inside each UI language for exactly that reason.
 *
 * Payload's own strings come from its `en` and `ar` packs (the `ar` one patched in the
 * config). No em dashes (.claude/rules/writing.md).
 */
export const adminStrings = {
  nav: {
    label: 'Main navigation',
    brand: 'B7R Print Website',
    expand: 'Expand the sidebar',
    collapse: 'Collapse the sidebar',
    closeMenu: 'Close the menu',
    groupToggle: 'collapse or expand the group',
    viewSite: 'View website',
  },
  entityHeader: {
    shows: 'Shows on:',
    listing: (label: string) => `See ${label} on the site`,
    sectionsOn: (total: number, on: number) => `${total} sections, ${on} on`,
  },
  header: {
    search: 'Search or jump to…',
    searchAria: 'Search or jump to a section',
    viewSite: 'View website',
  },
  account: {
    menu: 'Account menu',
    profile: 'My account',
    logout: 'Log out',
    roles: { admin: 'Admin', editor: 'Editor' } as Record<string, string>,
  },
  palette: {
    title: 'Jump to…',
    placeholder: 'Type a section, a page or a product',
    hint: 'Type two characters or more to search the content',
    sections: 'Sections',
    results: 'Content',
    empty: 'Nothing matches.',
    open: 'open',
    shortcut: 'Press Ctrl K anywhere',
    searching: 'Searching…',
    status: { draft: 'Draft', published: 'Published' } as Record<string, string>,
  },
  login: {
    noAccount: 'No account? Ask the site admin for one.',
  },
  savedBy: {
    by: 'by',
    never: 'No save recorded yet.',
  },
  warnings: {
    none: 'Nothing to flag.',
  },
  fields: {
    pickColor: 'Pick a colour',
  },
  common: {
    /** An admin action's failure line when the route answered with no message. */
    serverAnswered: 'The server answered {status}',
    /** A document with no title yet (a draft in progress); the list view says the same. */
    untitled: 'Untitled',
  },
  time: {
    /** Under a minute; the rest comes from `Intl.RelativeTimeFormat` (`admin/format.ts`). */
    justNow: 'just now',
  },
  locale: {
    /**
     * One line before the document controls of anything with per-language fields (ADR-044),
     * keyed by the CONTENT locale being edited, written in the UI language.
     */
    editing: { ar: 'Editing the Arabic content.', en: 'Editing the English content.' } as Record<
      string,
      string
    >,
    legend: {
      ar: 'Fields marked AR are per language; the rest is shared with English.',
      en: 'Fields marked EN are per language; the rest is shared with Arabic.',
    } as Record<string, string>,
  },
  engine: {
    generateNow: 'Generate now',
    queueing: 'Queueing…',
    queued: 'Queued: the run starts within a minute. Watch the runs list.',
    postTitle: 'Content engine',
    regenerate: 'Regenerate',
    regenerateHint: 'A new run from the topic replaces the text under the same address and cover.',
    importTitle: 'Bulk add from CSV',
    importHint:
      'Columns: title, hub (slug), primaryKeyword, secondaryKeywords (separated by ;), intent, priority. A header row is fine.',
    importPlaceholder: 'title,hub,primaryKeyword,secondaryKeywords,intent,priority',
    importButton: 'Import',
    importing: 'Importing…',
    importResult: '{created} added, {skipped} already there.',
    factsTitle: 'What the engine may say',
    factsHint:
      'Built live from the site settings, the products and the integrations, in Arabic and in English; every number a draft states is checked against this list.',
    factsNumbers: '{n} numbers on the sheet.',
    card: {
      title: 'Content engine',
      state: {
        off: 'Off',
        on: 'On',
        mock: 'Mock connection',
        noConnection: 'No connection',
        connectionOff: 'Connection off',
      },
      runStatus: {
        done: 'Done',
        failed: 'Failed',
        running: 'Running',
        skipped: 'Skipped',
      } as Record<string, string>,
      connection: 'Connection',
      connectionOff: 'off',
      noLimit: 'this month, no limit',
      pickConnection: 'None picked: add one under Connections, then pick it in the engine settings',
      postsThisMonth: 'Posts this month',
      averageScore: 'Average score',
      failures: 'Failed runs',
      cost: 'Cost this month (estimate)',
      nextSlot: 'Next slot',
      nextSlotOff: 'No run while the engine is off',
      nextSlotNoConnection: 'No run without a working connection',
      nextSlotToday: 'Today at {hour}:00 Riyadh',
      nextSlotDone: 'Done for today; tomorrow at {hour}:00 Riyadh',
      nextSlotSoon: 'Within the hour',
      recent: 'Latest runs',
      empty: 'No run yet. Add topics and switch the engine on, or press "Generate now" on a topic.',
      settings: 'Settings',
      topics: 'Topics',
      runs: 'Runs',
    },
  },
  connections: {
    test: 'Test connection',
    testing: 'Testing…',
    works: 'Works.',
    worksWith: 'Works: {model} answered. Recorded on the connection.',
    saveFirst: 'Save, then test.',
  },
  cells: {
    yesNo: ['Yes', 'No'] as const,
    onOff: ['On', 'Off'] as const,
    notYet: 'Not yet',
  },
  views: {
    adminsOnlyTitle: 'Admins only',
    adminsOnly: 'This page is for administrators. Ask an admin if you need its numbers.',
  },
  visibility: {
    overall: 'Visibility score',
    open: 'Open',
    countOf: '{done} of {total}',
    andMore: 'and {n} more',
    moreDone: '{n} more done',
    guaranteed: 'The site guarantees',
    status: { done: 'Done', next: 'Next', missing: 'Missing' },
    sections: {
      identity: 'Identity',
      crawl: 'Crawl access',
      extractability: 'Extractability',
      corroboration: 'Corroboration',
      measurement: 'Measurement',
      signals: 'Outside signals',
    },
    card: {
      title: 'Visibility score',
      link: 'The full score',
      hint: 'Search engines and AI assistants: what they can read, and what they say.',
    },
    page: {
      title: 'Visibility score',
      siteOnly: 'What you control: {n}%',
      intro: '{open} things to do. Every item links to the field that fixes it.',
      introOne: 'One thing to do. It links to the field that fixes it.',
      recompute: 'Recompute',
      howOverall:
        'The overall score is the weighted sum of every item, outside signals included (PageSpeed, the verifications, the assistants), so 100% means the site, the engines and the assistants all agree. A filled site with no service connected scores about 70; until the GEO content ships, the ceiling is 93.',
      howSiteOnly:
        '"What you control" counts only the items that need no outside service or assistant. Items with many documents earn pro-rata: 4 of 5 is 80%.',
      up: 'up {n} points since {date}',
      down: 'down {n} points since {date}',
      same: 'unchanged since {date}',
    },
    signals: {
      title: 'Outside signals',
      pullNow: 'Pull now',
      pulling: 'Queuing',
      queued: 'Queued: the snapshots land within the minute; reload to see them',
      asOf: 'as of {date}',
      waiting: 'Connected; the first snapshot lands after the next pull.',
      notConnected: 'Not connected.',
      connect: 'Connect',
      clicks: 'Clicks',
      impressions: 'Impressions',
      ctr: 'CTR',
      position: 'Position',
      query: 'Query',
      page: 'Page',
      mobile: 'Mobile',
      desktop: 'Desktop',
      window: '{from} to {to}',
      psiErrors: '{n} audit(s) failed; the row is partial.',
    },
    ledger: {
      title: 'Citation ledger',
      hint: 'Every morning each enabled AI connection is asked the prompts due on their period; the rates cover the last four weeks, on the prompts that do not name the brand.',
      runNow: 'Run now',
      queuing: 'Queuing',
      queued:
        'Queued: every prompt, whatever its period; the answers land within minutes, reload to see them',
      every: (n: number) => `(every ${n} days)`,
      viewAnswer: 'View answer',
      answerTitle: '{engine}, {date}',
      answerHint: 'The answer as the engine gave it; the links it cited are listed under it.',
      close: 'Close',
      noLimit: 'No monthly limit',
      empty:
        'No run yet. Add an AI connection under Admin, keep the prompts you want asked, then press Run now or wait for the morning run.',
      prompts: 'The prompts',
      prompt: 'Prompt',
      notRun: 'not run',
      cited: 'Named B7R',
      uncited: 'Did not name B7R',
      linked: 'Linked to the site',
      brand: '(names the brand)',
      rateLine: '{cited} of {runs} named B7R; {linked} linked',
      fix: 'No engine names B7R here: improve the answer block of',
      competitors: 'Competitors named most:',
    },
  },
  traffic: {
    groups: {
      ai: 'AI assistants',
      search: 'Search',
      social: 'Social',
      referral: 'Other sites',
      direct: 'Direct',
    },
    /** The channels that are words, not brands (`CHANNELS` in `traffic/channels.ts`). */
    channels: {
      'ai-other': 'Other AI',
      'search-other': 'Other search',
      'social-other': 'Other social',
      referral: 'Other sites',
      direct: 'Direct',
    } as Record<string, string>,
    card: {
      title: 'Traffic, last 7 days',
      landings: 'Landings',
      topChannel: 'Top channel',
      crawls: 'Crawler reads',
      empty: 'No landings yet: the count starts with the first visitor.',
      link: 'All traffic',
    },
    families: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      perplexity: 'Perplexity',
      microsoft: 'Microsoft',
      apple: 'Apple',
      meta: 'Meta',
      amazon: 'Amazon',
      bytedance: 'ByteDance',
      commoncrawl: 'Common Crawl',
      duckduckgo: 'DuckDuckGo',
      yandex: 'Yandex',
      other: 'Other',
    },
    roles: {
      answer: 'Answering a person',
      search: 'Indexing for search',
      training: 'Gathering for training',
    },
    page: {
      title: 'Traffic',
      intro: (days: number, since: string) =>
        `Where visitors came from and what the AI crawlers read over the last ${days} days, from ${since} (Riyadh).`,
      range: 'Range',
      days: (n: number) => `${n} days`,
      aiShare: 'From AI assistants',
      channels: 'Channels',
      channel: 'Channel',
      group: 'Group',
      landings: 'Landings',
      share: 'Share',
      seen: 'Seen',
      sources: 'Sources',
      source: 'Source',
      pages: 'Landing pages',
      pageCol: 'Page',
      topChannel: 'Brought most by',
      crawlers: 'Crawlers',
      bot: 'Bot',
      family: 'Company',
      role: 'Purpose',
      reads: 'Reads',
      readMost: 'Read most',
      empty: 'Nothing in this range yet.',
      honesty: [
        'Our own count, not an audit: a landing is a page opened from another site or from nowhere; nothing about the visitor is kept.',
        'Google’s AI Overviews and AI Mode arrive with a Google referrer and read as Google.',
        'The native apps (ChatGPT’s, the in-app browsers) send no referrer, so some of their visits count as direct.',
      ],
    },
  },
  dashboard: {
    greeting: 'Welcome, {name}',
    intro: 'Everything on the site starts here.',
    quick: 'Start here',
    actions: {
      home: { title: 'Home page', text: 'Edit the sections and publish' },
      addPage: { title: 'Add a page', text: 'A new page with its own URL' },
      addProduct: { title: 'Add a product', text: 'Prices, photos and sizes' },
      addFaq: { title: 'Add a question', text: 'A new entry in the FAQ' },
      addPost: { title: 'Write a post', text: 'A new article on the blog' },
      site: { title: 'View website', text: 'As a visitor sees it' },
    },
    health: {
      title: 'System status',
      engine: {
        on: 'Content engine on',
        off: 'Content engine off',
        mock: 'Content engine on (mock connection)',
        noConnection: 'Content engine on with no connection',
        connectionOff: 'Content engine on, its connection off',
      },
      check: 'Full report',
      version: 'Version',
      rows: {
        db: { ok: 'Database answering', error: 'Database not answering' },
        jobs: { on: 'Scheduled jobs running', off: 'Scheduled jobs not started yet' },
        jobsFailed: {
          none: 'No failed jobs',
          some: '{n} failed jobs',
          unknown: 'Job status unknown',
        },
        email: {
          resend: 'E-mail goes out through Resend',
          console: 'E-mail printed to the log, no provider',
        },
        turnstile: { on: 'Bot check on', off: 'Bot check off' },
        indexnow: { on: 'Search-engine pings on', off: 'Search-engine pings off' },
        media: { s3: 'Media on cloud storage', local: 'Media on the server disk' },
        contact: {
          live: 'Contact form sending',
          mock: 'Contact form in test mode',
          off: 'Contact form off',
        },
        newsletter: {
          live: 'Newsletter recording subscribers',
          mock: 'Newsletter in test mode',
          off: 'Newsletter off',
        },
      },
    },
    recent: {
      title: 'Latest changes',
      empty: 'No changes yet. Start with the home page.',
      by: 'by {name}',
      draft: 'Draft',
      published: 'Published',
    },
  },
} as const;

/**
 * The shape of the tree with every literal widened: a string leaf is `string`, a two-word
 * pair stays a pair, a list of lines a list, a function keeps its signature, a record its
 * keys. The Arabic tree is typed as this, so a key missing there is a compile error.
 */
type Widen<T> = T extends (...args: infer A) => infer R
  ? (...args: A) => R
  : T extends readonly [string, string]
    ? readonly [string, string]
    : T extends readonly string[]
      ? readonly string[]
      : T extends string
        ? string
        : T extends object
          ? { readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type AdminStrings = Widen<typeof adminStrings>;

/** Arabic counts of days: one, two, three to ten, eleven and up (the four Arabic plurals). */
function arabicDays(n: number): string {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومين';
  if (n >= 3 && n <= 10) return `${n} أيام`;
  return `${n} يوماً`;
}

/**
 * The Arabic tree, under the ux-araby rules (design system §5): nominal labels, verb-first
 * actions, light passives and never «تم», the Arabic comma, «أو» not «/», no «!», Western
 * digits, brand and product names and codes kept Latin. The keys are the English tree's.
 */
export const adminStringsAr: AdminStrings = {
  nav: {
    label: 'التنقل الرئيسي',
    brand: 'موقع بحر برنت',
    expand: 'وسّع الشريط الجانبي',
    collapse: 'اطوِ الشريط الجانبي',
    closeMenu: 'أغلق القائمة',
    groupToggle: 'اطوِ المجموعة أو وسّعها',
    viewSite: 'عرض الموقع',
  },
  entityHeader: {
    shows: 'يظهر في:',
    listing: (label) => `شاهد ${label} في الموقع`,
    sectionsOn: (total, on) => `${total} أقسام، ${on} منها مفعّلة`,
  },
  header: {
    search: 'ابحث أو انتقل إلى…',
    searchAria: 'ابحث أو انتقل إلى قسم',
    viewSite: 'عرض الموقع',
  },
  account: {
    menu: 'قائمة الحساب',
    profile: 'حسابي',
    logout: 'تسجيل الخروج',
    roles: { admin: 'مدير', editor: 'محرّر' },
  },
  palette: {
    title: 'انتقل إلى…',
    placeholder: 'اكتب اسم قسم أو صفحة أو منتج',
    hint: 'اكتب حرفين أو أكثر للبحث في المحتوى',
    sections: 'الأقسام',
    results: 'المحتوى',
    empty: 'لا نتائج مطابقة.',
    open: 'فتح',
    shortcut: 'اضغط Ctrl K من أي مكان',
    searching: 'جارٍ البحث…',
    status: { draft: 'مسودة', published: 'منشور' },
  },
  login: {
    noAccount: 'ليس لديك حساب؟ اطلب واحداً من مدير الموقع.',
  },
  savedBy: {
    by: 'بواسطة',
    never: 'لا حفظ مسجّل بعد.',
  },
  warnings: {
    none: 'لا ملاحظات.',
  },
  fields: {
    pickColor: 'اختر لوناً',
  },
  common: {
    serverAnswered: 'أجاب الخادم بالرمز {status}',
    untitled: 'بلا عنوان',
  },
  time: {
    justNow: 'الآن',
  },
  locale: {
    editing: { ar: 'تحرير المحتوى العربي.', en: 'تحرير المحتوى الإنجليزي.' },
    legend: {
      ar: 'الحقول المعلّمة AR تختلف بحسب اللغة؛ والبقية مشتركة مع الإنجليزية.',
      en: 'الحقول المعلّمة EN تختلف بحسب اللغة؛ والبقية مشتركة مع العربية.',
    },
  },
  engine: {
    generateNow: 'ولّد الآن',
    queueing: 'جارٍ الإرسال…',
    queued: 'في الطابور: تبدأ الجولة خلال دقيقة. تابع السجل.',
    postTitle: 'محرّك المحتوى',
    regenerate: 'أعد التوليد',
    regenerateHint: 'جولة جديدة من الموضوع تستبدل النص وتبقي الرابط والغلاف كما هما.',
    importTitle: 'إضافة دفعة من CSV',
    importHint:
      'الأعمدة: title، hub (slug)، primaryKeyword، secondaryKeywords (مفصولة بـ ;)، intent، priority. لا بأس بصف عناوين.',
    importPlaceholder: 'title,hub,primaryKeyword,secondaryKeywords,intent,priority',
    importButton: 'استيراد',
    importing: 'جارٍ الاستيراد…',
    importResult: '{created} مضافة، {skipped} موجودة مسبقاً.',
    factsTitle: 'ما يجوز للمحرّك قوله',
    factsHint:
      'تُبنى مباشرة من إعدادات الموقع والمنتجات والتكاملات، بالعربية والإنجليزية؛ وكل رقم تذكره المسودة يُراجع على هذه القائمة.',
    factsNumbers: 'الأرقام في الورقة: {n}.',
    card: {
      title: 'محرّك المحتوى',
      state: {
        off: 'متوقف',
        on: 'يعمل',
        mock: 'اتصال تجريبي',
        noConnection: 'بلا اتصال',
        connectionOff: 'الاتصال متوقف',
      },
      runStatus: {
        done: 'اكتملت',
        failed: 'فشلت',
        running: 'تعمل',
        skipped: 'تُخطّيت',
      },
      connection: 'الاتصال',
      connectionOff: 'متوقف',
      noLimit: 'هذا الشهر، بلا حد',
      pickConnection: 'لم يُختر اتصال: أضف واحداً في الاتصالات، ثم اختره في إعدادات المحرّك',
      postsThisMonth: 'مقالات هذا الشهر',
      averageScore: 'متوسط الدرجة',
      failures: 'جولات فاشلة',
      cost: 'تكلفة هذا الشهر (تقديرية)',
      nextSlot: 'الموعد التالي',
      nextSlotOff: 'لا جولة والمحرّك متوقف',
      nextSlotNoConnection: 'لا جولة بلا اتصال يعمل',
      nextSlotToday: 'اليوم الساعة {hour}:00 بتوقيت الرياض',
      nextSlotDone: 'اكتمل اليوم؛ غداً الساعة {hour}:00 بتوقيت الرياض',
      nextSlotSoon: 'خلال ساعة',
      recent: 'آخر الجولات',
      empty: 'لا جولات بعد. أضف مواضيع وشغّل المحرّك، أو اضغط «ولّد الآن» في موضوع.',
      settings: 'الإعدادات',
      topics: 'المواضيع',
      runs: 'السجل',
    },
  },
  connections: {
    test: 'اختبر الاتصال',
    testing: 'جارٍ الاختبار…',
    works: 'يعمل.',
    worksWith: 'يعمل: أجاب {model}. سُجّلت النتيجة في الاتصال.',
    saveFirst: 'احفظ أولاً، ثم اختبر.',
  },
  cells: {
    yesNo: ['نعم', 'لا'],
    onOff: ['مفعّل', 'متوقف'],
    notYet: 'ليس بعد',
  },
  views: {
    adminsOnlyTitle: 'للمديرين فقط',
    adminsOnly: 'هذه الصفحة للمديرين. اطلب أرقامها من مدير إن احتجتها.',
  },
  visibility: {
    overall: 'درجة الظهور',
    open: 'افتح',
    countOf: '{done} من {total}',
    andMore: 'و{n} أخرى',
    moreDone: '{n} أخرى مكتملة',
    guaranteed: 'ما يضمنه الموقع',
    status: { done: 'مكتمل', next: 'التالي', missing: 'ناقص' },
    sections: {
      identity: 'الهوية',
      crawl: 'إتاحة الزحف',
      extractability: 'قابلية الاستخلاص',
      corroboration: 'الإسناد',
      measurement: 'القياس',
      signals: 'الإشارات الخارجية',
    },
    card: {
      title: 'درجة الظهور',
      link: 'الدرجة كاملة',
      hint: 'محركات البحث ومساعدو الذكاء الاصطناعي: ما يقرؤونه، وما يقولونه.',
    },
    page: {
      title: 'درجة الظهور',
      siteOnly: 'ما بيدك: {n}%',
      intro: 'البنود المفتوحة: {open}. كل بند يرتبط بالحقل الذي يصلحه.',
      introOne: 'بند واحد مفتوح. يرتبط بالحقل الذي يصلحه.',
      recompute: 'أعد الحساب',
      howOverall:
        'الدرجة الكلية هي المجموع الموزون لكل البنود، بما فيها الإشارات الخارجية (PageSpeed والتحققات والمساعدون)، فدرجة 100% تعني أن الموقع والمحركات والمساعدين متفقون جميعاً. موقع مكتمل بلا خدمة متصلة يحصل على نحو 70؛ وحتى يصدر محتوى GEO يبقى الحد الأعلى 93.',
      howSiteOnly:
        '«ما بيدك» يحسب فقط البنود التي لا تحتاج خدمة خارجية ولا مساعداً. البنود ذات المستندات المتعددة تُحتسب بالنسبة: 4 من 5 تساوي 80%.',
      up: 'ارتفعت بمقدار {n} منذ {date}',
      down: 'انخفضت بمقدار {n} منذ {date}',
      same: 'بلا تغيير منذ {date}',
    },
    signals: {
      title: 'الإشارات الخارجية',
      pullNow: 'اسحب الآن',
      pulling: 'جارٍ الإرسال',
      queued: 'في الطابور: تصل اللقطات خلال دقيقة؛ أعد التحميل لرؤيتها',
      asOf: 'بتاريخ {date}',
      waiting: 'متصل؛ تصل أول لقطة بعد السحب التالي.',
      notConnected: 'غير متصل.',
      connect: 'اربط',
      clicks: 'النقرات',
      impressions: 'مرات الظهور',
      ctr: 'نسبة النقر',
      position: 'الترتيب',
      query: 'الاستعلام',
      page: 'الصفحة',
      mobile: 'الجوال',
      desktop: 'سطح المكتب',
      window: 'من {from} إلى {to}',
      psiErrors: 'الفحوص الفاشلة: {n}؛ الصف ناقص.',
    },
    ledger: {
      title: 'سجل الاستشهادات',
      hint: 'كل صباح يُسأل كل اتصال ذكاء اصطناعي مفعّل الأسئلة المستحقة بحسب دوريتها؛ وتغطي النسب الأسابيع الأربعة الأخيرة، على الأسئلة التي لا تذكر العلامة.',
      runNow: 'شغّل الآن',
      queuing: 'جارٍ الإرسال',
      queued: 'في الطابور: كل الأسئلة أياً كانت دوريتها؛ تصل الإجابات خلال دقائق، أعد التحميل لرؤيتها',
      every: (n) => `(كل ${arabicDays(n)})`,
      viewAnswer: 'عرض الإجابة',
      answerTitle: '{engine}، {date}',
      answerHint: 'الإجابة كما أعطاها المحرّك؛ والروابط التي استشهد بها مدرجة تحتها.',
      close: 'إغلاق',
      noLimit: 'بلا حد شهري',
      empty:
        'لا جولات بعد. أضف اتصال ذكاء اصطناعي في الإدارة، وأبقِ الأسئلة التي تريد طرحها، ثم اضغط «شغّل الآن» أو انتظر الاثنين.',
      prompts: 'الأسئلة',
      prompt: 'السؤال',
      notRun: 'لم يُشغّل',
      cited: 'ذكر بحر برنت',
      uncited: 'لم يذكر بحر برنت',
      linked: 'أدرج رابط الموقع',
      brand: '(يذكر العلامة)',
      rateLine: '{cited} من {runs} ذكرت بحر برنت؛ {linked} أدرجت رابطاً',
      fix: 'لا محرّك يذكر بحر برنت هنا: حسّن كتلة الإجابة في',
      competitors: 'المنافسون الأكثر ذكراً:',
    },
  },
  traffic: {
    groups: {
      ai: 'مساعدو الذكاء الاصطناعي',
      search: 'البحث',
      social: 'التواصل الاجتماعي',
      referral: 'مواقع أخرى',
      direct: 'مباشر',
    },
    channels: {
      'ai-other': 'ذكاء اصطناعي آخر',
      'search-other': 'بحث آخر',
      'social-other': 'تواصل آخر',
      referral: 'مواقع أخرى',
      direct: 'مباشر',
    },
    card: {
      title: 'الزيارات، آخر 7 أيام',
      landings: 'الزيارات',
      topChannel: 'القناة الأولى',
      crawls: 'قراءات الزواحف',
      empty: 'لا زيارات بعد: يبدأ العدّ مع أول زائر.',
      link: 'كل الزيارات',
    },
    families: {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      perplexity: 'Perplexity',
      microsoft: 'Microsoft',
      apple: 'Apple',
      meta: 'Meta',
      amazon: 'Amazon',
      bytedance: 'ByteDance',
      commoncrawl: 'Common Crawl',
      duckduckgo: 'DuckDuckGo',
      yandex: 'Yandex',
      other: 'أخرى',
    },
    roles: {
      answer: 'يجيب شخصاً',
      search: 'يفهرس للبحث',
      training: 'يجمع للتدريب',
    },
    page: {
      title: 'مصادر الزيارات',
      intro: (n, since) =>
        `من أين جاء الزوار وما قرأته زواحف الذكاء الاصطناعي خلال آخر ${arabicDays(n)}، منذ ${since} (بتوقيت الرياض).`,
      range: 'المدة',
      days: arabicDays,
      aiShare: 'من مساعدي الذكاء الاصطناعي',
      channels: 'القنوات',
      channel: 'القناة',
      group: 'المجموعة',
      landings: 'الزيارات',
      share: 'النسبة',
      seen: 'الفترة',
      sources: 'المصادر',
      source: 'المصدر',
      pages: 'صفحات الهبوط',
      pageCol: 'الصفحة',
      topChannel: 'أكثر قناة جلبت',
      crawlers: 'الزواحف',
      bot: 'الزاحف',
      family: 'الشركة',
      role: 'الغرض',
      reads: 'القراءات',
      readMost: 'الأكثر قراءة',
      empty: 'لا شيء في هذه المدة بعد.',
      honesty: [
        'عدّ الموقع نفسه، لا تدقيق: الزيارة صفحة فُتحت من موقع آخر أو من غير مصدر؛ ولا يُحفظ شيء عن الزائر.',
        'تصل AI Overviews وAI Mode من Google بمُحيل Google وتُحسب على Google.',
        'التطبيقات الأصلية (تطبيق ChatGPT والمتصفحات داخل التطبيقات) لا ترسل مُحيلاً، فتُحسب بعض زياراتها مباشرة.',
      ],
    },
  },
  dashboard: {
    greeting: 'مرحباً، {name}',
    intro: 'كل ما في الموقع يبدأ من هنا.',
    quick: 'ابدأ من هنا',
    actions: {
      home: { title: 'الصفحة الرئيسية', text: 'عدّل الأقسام وانشر' },
      addPage: { title: 'أضف صفحة', text: 'صفحة جديدة برابطها الخاص' },
      addProduct: { title: 'أضف منتجاً', text: 'الأسعار والصور والمقاسات' },
      addFaq: { title: 'أضف سؤالاً', text: 'سؤال جديد في الأسئلة الشائعة' },
      addPost: { title: 'اكتب مقالاً', text: 'مقال جديد في المدونة' },
      site: { title: 'عرض الموقع', text: 'كما يراه الزائر' },
    },
    health: {
      title: 'حالة النظام',
      engine: {
        on: 'محرّك المحتوى يعمل',
        off: 'محرّك المحتوى متوقف',
        mock: 'محرّك المحتوى يعمل (اتصال تجريبي)',
        noConnection: 'محرّك المحتوى يعمل بلا اتصال',
        connectionOff: 'محرّك المحتوى يعمل واتصاله متوقف',
      },
      check: 'التقرير الكامل',
      version: 'الإصدار',
      rows: {
        db: { ok: 'قاعدة البيانات تستجيب', error: 'قاعدة البيانات لا تستجيب' },
        jobs: { on: 'المهام المجدولة تعمل', off: 'المهام المجدولة لم تبدأ بعد' },
        jobsFailed: {
          none: 'لا مهام فاشلة',
          some: 'المهام الفاشلة: {n}',
          unknown: 'حالة المهام غير معروفة',
        },
        email: {
          resend: 'البريد يُرسل عبر Resend',
          console: 'البريد يُطبع في السجل، بلا مزوّد',
        },
        turnstile: { on: 'فحص الروبوتات مفعّل', off: 'فحص الروبوتات متوقف' },
        indexnow: { on: 'تنبيهات محركات البحث مفعّلة', off: 'تنبيهات محركات البحث متوقفة' },
        media: { s3: 'الوسائط على التخزين السحابي', local: 'الوسائط على قرص الخادم' },
        contact: {
          live: 'نموذج التواصل يُرسل',
          mock: 'نموذج التواصل في وضع الاختبار',
          off: 'نموذج التواصل متوقف',
        },
        newsletter: {
          live: 'النشرة البريدية تسجّل المشتركين',
          mock: 'النشرة البريدية في وضع الاختبار',
          off: 'النشرة البريدية متوقفة',
        },
      },
    },
    recent: {
      title: 'آخر التغييرات',
      empty: 'لا تغييرات بعد. ابدأ بالصفحة الرئيسية.',
      by: 'بواسطة {name}',
      draft: 'مسودة',
      published: 'منشور',
    },
  },
};

/** The tree for a UI language: Arabic for `ar`, English for anything else (the fallback). */
export function adminStringsFor(language: string): AdminStrings {
  return language === 'ar' ? adminStringsAr : adminStrings;
}

/** Payload's own rule for the document direction, so our components agree with `html[dir]`. */
export function adminDirection(language: string): 'ltr' | 'rtl' {
  return (rtlLanguages as readonly string[]).includes(language) ? 'rtl' : 'ltr';
}
