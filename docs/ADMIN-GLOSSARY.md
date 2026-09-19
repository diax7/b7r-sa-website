# Admin glossary

One word per thing (ADR-046), in both languages of the panel (ADR-056). Generated from
`src/modules/cms/admin/glossary.ts` by `pnpm glossary`; `tests/admin-glossary.test.ts` checks
this file against the table and refuses every "never" form across the panel’s Arabic (the
string trees, the Payload overrides, the description maps, the config labels and options,
the visibility rules). Edit the table, not this file.

A term marked Latin stays in Latin letters inside Arabic copy: brands, services, formats
and tokens. Everything else has its one Arabic word; the "never" column lists the forms the
test refuses (translations of a Latin term, or synonyms of the settled word).

| Area | English | In Arabic copy | Latin | Never | Note |
|---|---|---|---|---|---|
| The panel | panel (the admin) | اللوحة |  | لوحة الإدارة |  |
| The panel | dashboard | لوحة التحكم |  | لوحة القيادة، لوحة المعلومات | The panel's front page; Payload's own word. |
| The panel | panel language | لغة اللوحة |  | لغة الواجهة |  |
| The panel | content language | لغة المحتوى |  | لغة المستند |  |
| The panel | Arabic / English | العربية / الإنجليزية |  | الانجليزية، الإنكليزية |  |
| The panel | admin (role) | مدير |  | المسؤول، الأدمن |  |
| The panel | editor (role) | محرّر |  |  |  |
| The panel | user | مستخدم |  | العضو |  |
| The panel | account | حساب |  |  |  |
| The panel | publish / published | نشر / منشور |  | إطلاق | The status pill's word everywhere: the list, the dashboard, the palette. |
| The panel | draft | مسودة |  | مسودة أولية، النسخة الأولية | One spelling, no shadda; the status pill, the dashboard tile, the rules. |
| The panel | changed (a draft over a published version) | معدّل |  | متغيّر، معدل جزئياً | The list pill of a live document with newer text waiting (ADR-060); amber, never folded into Draft. |
| The panel | save / last saved | حفظ / آخر حفظ |  |  |  |
| The panel | settings | الإعدادات |  | الضبط، التهيئة |  |
| The panel | field | حقل |  | الفيلد |  |
| The panel | tab (of a form) | تبويب |  | التاب، علامة التبويب |  |
| The panel | version (of a document) | نسخة |  |  | The build number on the dashboard is «الإصدار», a different thing. |
| The panel | required | مطلوب |  | إلزامي، إلزامية، إجباري |  |
| The panel | optional | اختياري |  | غير إلزامي |  |
| The panel | empty | فارغ |  | خالي، خال |  |
| The panel | on / off (a switch) | مفعّل / معطّل |  | مطفأ، مشغل | A thing that runs is «يعمل» / «متوقف» (the engine, a job); a switch is on or off. |
| The panel | running / stopped | يعمل / متوقف |  | قيد التشغيل، موقوف |  |
| The panel | order (sort) | الترتيب |  | التسلسل |  |
| The panel | notification / warning | تنبيه |  | إشعار، إشعارات، تحذير، تحذيرات | A failure alert and an editorial warning are both a heads-up; plural «تنبيهات». |
| The panel | notes | ملاحظات |  |  |  |
| The panel | e-mail | البريد الإلكتروني |  | الإيميل، البريد الالكتروني |  |
| The panel | library (of images) | المكتبة |  |  |  |
| The panel | test (a connection) | اختبار |  | تجربة الاتصال |  |
| The panel | queue | الطابور |  | قائمة الانتظار |  |
| The panel | scheduled jobs | المهام المجدولة |  | الوظائف المجدولة |  |
| The panel | character (a limit) | حرف |  |  |  |
| The panel | desktop (screen) | الحاسوب |  | سطح المكتب، الكمبيوتر، ديسكتوب |  |
| The panel | phone (screen) | الجوال |  | موبايل، الهاتف المحمول، الهاتف الذكي |  |
| The panel | screen reader | قارئ الشاشة |  | القارئ الصوتي |  |
| The panel | Riyadh time | بتوقيت الرياض |  | توقيت السعودية |  |
| The panel | SAR | ريال |  | ر.س |  |
| The panel | USD | دولار |  | دولار أمريكي |  |
| The site | site | الموقع |  |  |  |
| The site | home page | الصفحة الرئيسية |  | الصفحة الأولى، صفحة البداية | «الرئيسية» alone in running text. |
| The site | page | صفحة |  |  |  |
| The site | section (of a page) / hub (of the blog) | قسم |  | سكشن، تصنيف | A section of a thing: a page block, or the blog section a post belongs to («أقسام المدونة»); a page form and a post form never show both. |
| The site | header | الترويسة |  | رأس الصفحة، هيدر |  |
| The site | footer | التذييل |  | فوتر، ذيل الصفحة |  |
| The site | menu | القائمة |  | منيو |  |
| The site | button | زر |  | زرار |  |
| The site | link | رابط |  | وصلة، لينك |  |
| The site | card | بطاقة |  | كرت |  |
| The site | slide | شريحة |  | سلايد |  |
| The site | opening slides | الشرائح الافتتاحية |  | هيرو |  |
| The site | chip (small badge) | شارة |  |  |  |
| The site | bottom banner | شريط الدعوة |  | بانر |  |
| The site | title | العنوان |  |  |  |
| The site | line under the title | السطر تحت العنوان |  | العنوان الفرعي |  |
| The site | tagline | الجملة التعريفية |  | الشعار النصي، السطر التعريفي |  |
| The site | brand | العلامة |  | البراند، الماركة |  |
| The site | designer | المصمّم |  | أداة التصميم |  |
| The site | calculator | الحاسبة |  | الآلة الحاسبة |  |
| The site | welcome credit | الرصيد الترحيبي |  | رصيد الترحيب، الرصيد المجاني |  |
| The site | delivery | التوصيل |  | التسليم |  |
| The site | shipping (from where) | الشحن |  |  |  |
| The site | visitor | زائر |  |  |  |
| The site | merchant | تاجر |  | البائع، العميل |  |
| The site | testimonial | رأي تاجر |  | شهادة العميل |  |
| The site | sample (a placeholder testimonial) | نموذج |  | عينة |  |
| The site | contact form | نموذج التواصل |  | استمارة |  |
| The site | connected stores | المتاجر المتصلة |  | التكاملات، المنصات المتصلة |  |
| The site | platform (a store platform) | منصة |  |  |  |
| The site | image / photo | صورة |  | الوسائط، وسائط، ميديا |  |
| The site | icon | أيقونة |  | ايقونة |  |
| The site | alt text | النص البديل |  | الوصف البديل | The attribute itself is `alt`. |
| The site | search title | عنوان البحث |  | العنوان الوصفي، عنوان ميتا |  |
| The site | search description | وصف البحث |  | الوصف الوصفي، وصف ميتا |  |
| The site | search result | نتيجة البحث |  |  |  |
| The site | browser tab | تبويب المتصفح |  |  |  |
| The site | share image | صورة المشاركة |  | صورة المعاينة | The tag itself is `og:image`. |
| The site | search engines | محركات البحث |  | محركات الفهرسة |  |
| The site | search data (structured data, schema) | بيانات البحث |  | البيانات المهيكلة، البيانات المنظمة، بيانات المنظمة، مخطط المتجر، سكيما | What search engines and assistants read behind the page: one name for all of it. |
| The site | sitemap | خريطة الموقع |  | سايت ماب |  |
| The site | consent bar / cookies | شريط الموافقة / ملفات الارتباط |  | كوكيز، ملفات تعريف الارتباط، ملفات تعريف |  |
| The site | redirect | تحويل |  | إعادة التوجيه، إعادة توجيه |  |
| The site | fixed pages | الصفحات الثابتة |  | الصفحات الأساسية |  |
| The site | address / path | عنوان / مسار |  |  |  |
| Catalogue | catalogue | الكتالوج |  |  |  |
| Catalogue | product | منتج |  | سلعة |  |
| Catalogue | colour | لون |  |  |  |
| Catalogue | size | مقاس |  |  |  |
| Catalogue | print area | منطقة الطباعة |  | مساحة الطباعة |  |
| Catalogue | base cost | التكلفة الأساسية |  | سعر التكلفة |  |
| Catalogue | suggested price | سعر البيع المقترح |  | السعر المقترح |  |
| Catalogue | FAQ | الأسئلة الشائعة |  | الأسئلة المتكررة |  |
| Catalogue | question (a FAQ entry, a buyer prompt) | سؤال |  | مدخل، موجه، موجهات، أمر نصي | One word on the FAQ and in the ledger: what a visitor or a buyer asks. |
| Catalogue | answer | الإجابة |  | الجواب، جواب |  |
| Catalogue | group (of FAQ) | مجموعة |  |  | Never «قسم»: that is a blog hub or a page section. |
| Blog | blog | المدونة |  | بلوق |  |
| Blog | post | مقال |  | تدوينة، مقالة |  |
| Blog | author | كاتب |  | المؤلف |  |
| Blog | byline | سطر التوقيع |  |  |  |
| Blog | tag | وسم |  | تاق، الكلمة الدلالية |  |
| Blog | cover | غلاف |  | الصورة الرئيسية، الصورة البارزة |  |
| Blog | key takeaways | أهم النقاط |  | النقاط الرئيسية، نقاط رئيسية، خلاصات |  |
| Blog | excerpt | المقتطف |  |  |  |
| Blog | body | المتن |  | جسم المقال |  |
| Blog | rich text | نص منسّق |  | النص الغني |  |
| Blog | reading time | مدة القراءة |  | وقت القراءة، دقائق القراءة |  |
| Content engine | content engine | محرّك المحتوى |  | المولد، محرك الذكاء | «المحرّك» alone inside its own forms. |
| Content engine | run | جولة |  | تشغيل، تشغيلة، تشغيلات | The noun; the button is still «شغّل الآن». |
| Content engine | runs (the log) | الجولات |  |  |  |
| Content engine | topic | موضوع |  | موضوعات | Plural «المواضيع». |
| Content engine | backlog | قائمة المواضيع |  | متراكمات | «القائمة» alone inside the topics form; the site menu is the other «القائمة». |
| Content engine | connection | اتصال |  |  |  |
| Content engine | service (the AI vendor) | الخدمة |  | مزود، مزودة | OpenAI, Anthropic, Google: the same word on a connection, a run and a citation. |
| Content engine | model | النموذج |  | موديل |  |
| Content engine | API key | مفتاح API |  | المفتاح السري، مفتاح الواجهة |  |
| Content engine | input / output tokens | رموز الإدخال / رموز الإخراج |  | رموز الدخل، رموز الخرج، توكن، توكنات |  |
| Content engine | cost | التكلفة |  | كلفة |  |
| Content engine | spend | الإنفاق |  | مصروف |  |
| Content engine | estimate | تقديري |  | تقريبي |  |
| Content engine | limit (a cap) | الحد |  | سقف | The engine limits posts, a connection limits dollars; one word. |
| Content engine | schedule | جدولة |  |  |  |
| Content engine | system prompt | التعليمات الأساسية |  | موجه النظام، برومبت |  |
| Content engine | style guide | دليل الأسلوب |  | دليل النمط |  |
| Content engine | self-review | المراجعة الذاتية |  | التقييم الذاتي |  |
| Content engine | quality threshold | حد الجودة |  | عتبة الجودة |  |
| Content engine | keyword | الكلمة المفتاحية |  | الكلمة الرئيسية |  |
| Content engine | intent | القصد |  |  |  |
| Content engine | priority | الأولوية |  |  |  |
| Content engine | facts sheet | ورقة الحقائق |  | قائمة الحقائق |  |
| Content engine | refresh (freshness) | تحديث |  |  |  |
| Content engine | digest | ملخص |  | موجز |  |
| Visibility | visibility | الظهور |  | المرئية، الوضوح |  |
| Visibility | score | الدرجة |  | نقاط الظهور، مؤشر الظهور | The Score page is «درجة الظهور». |
| Visibility | AI assistant | مساعد ذكاء اصطناعي |  | مساعد AI، الشات بوت، روبوت المحادثة |  |
| Visibility | citation | استشهاد |  |  |  |
| Visibility | citation ledger | سجل الاستشهادات |  | سجل الاستشهاد، سجل الاقتباسات |  |
| Visibility | cited rate | نسبة الاستشهاد |  | معدل الاستشهاد |  |
| Visibility | competitor | منافس |  |  |  |
| Visibility | outside signals | الإشارات الخارجية |  | المؤشرات الخارجية |  |
| Visibility | snapshot | لقطة |  | صورة لحظية |  |
| Visibility | pull | سحب |  | جلب |  |
| Visibility | off-site checklist | قائمة الحضور الخارجي |  | قائمة التحقق، قائمة المهام |  |
| Visibility | impressions | مرات الظهور |  | الانطباعات، مرات العرض |  |
| Visibility | clicks | النقرات |  | الضغطات |  |
| Visibility | query (a search) | الاستعلام |  |  |  |
| Visibility | verification token | رمز التحقق |  | كود التحقق |  |
| Traffic | traffic (the page) | مصادر الزيارات |  | حركة المرور، ترافيك، حركة الزيارات |  |
| Traffic | visit / landing | زيارة |  | هبوط |  |
| Traffic | visitors (the people, by Umami) | الزوّار |  | الزائرون، الزائرين | The dashboard’s visits tile and the people row when Umami counts (ADR-048 amended); a landing stays «زيارة», a user «مستخدم». |
| Traffic | page views | مشاهدات الصفحات |  | الصفحات المعروضة |  |
| Traffic | entry page | صفحة الدخول |  | صفحة الهبوط، صفحات الهبوط |  |
| Traffic | crawl | زحف |  |  |  |
| Traffic | crawler (a bot) | زاحف |  | عنكبوت |  |
| Traffic | channel | قناة |  |  |  |
| Traffic | referrer | المُحيل |  |  |  |
| External services, formats and tokens | API | API | yes | واجهة برمجة، واجهة برمجية، واجهات برمجة، واجهة التطبيقات |  |
| External services, formats and tokens | JSON | JSON | yes | جيسون |  |
| External services, formats and tokens | URL | URL | yes | يو آر إل | A link is «رابط», an address «عنوان»; the token stays URL. |
| External services, formats and tokens | slug | slug | yes | سلاغ، سلج، الاسم اللطيف | Glossed once on the label: «المعرّف في الرابط (slug)». |
| External services, formats and tokens | UTM | UTM | yes |  |  |
| External services, formats and tokens | CSV | CSV | yes | سي إس في |  |
| External services, formats and tokens | CSP | CSP | yes | سياسة أمان المحتوى | Never named to an editor; the panel says which addresses the site allows. |
| External services, formats and tokens | IndexNow | IndexNow | yes | إندكس ناو |  |
| External services, formats and tokens | Search Console | Search Console | yes | سيرش كونسول، كونسول البحث، وحدة تحكم البحث |  |
| External services, formats and tokens | Bing Webmaster Tools | Bing Webmaster Tools | yes | بينغ، أدوات مشرفي |  |
| External services, formats and tokens | PageSpeed Insights | PageSpeed Insights | yes | بيج سبيد، سرعة الصفحة |  |
| External services, formats and tokens | Umami | Umami | yes | أومامي |  |
| External services, formats and tokens | GA4 (Google Analytics 4) | GA4 | yes | تحليلات جوجل، تحليلات Google، جوجل أناليتكس |  |
| External services, formats and tokens | Google | Google | yes | جوجل، غوغل، قوقل |  |
| External services, formats and tokens | ChatGPT / Copilot / Gemini / Claude | ChatGPT / Copilot / Gemini / Claude | yes | شات جي بي تي، جيميناي، كلود |  |
| External services, formats and tokens | WhatsApp | WhatsApp | yes | واتساب، الواتس، واتس اب |  |
| External services, formats and tokens | X / Instagram / TikTok / LinkedIn / YouTube | X / Instagram / TikTok / LinkedIn / YouTube | yes | إنستغرام، انستقرام، إنستقرام، تيك توك، لينكدإن، لينكد إن، يوتيوب، تويتر |  |
| External services, formats and tokens | Turnstile | Turnstile | yes | تيرنستايل | The dashboard says what it does: «فحص الروبوتات». |
| External services, formats and tokens | Resend | Resend | yes | ريسند |  |
| External services, formats and tokens | Pexels | Pexels | yes | بكسلز |  |
| External services, formats and tokens | Cal.com | Cal.com | yes |  |  |
| External services, formats and tokens | Salla / Zid | سلة / زد |  |  | The platforms' own Arabic names, as the site shows them. |
| External services, formats and tokens | Shopify | Shopify | yes | شوبيفاي |  |
| External services, formats and tokens | Misk | مسك |  |  | The foundation's own Arabic name; the programme is Launchpad. |
| External services, formats and tokens | model ids | gpt-4.1-mini, claude-haiku-4-5, gemini-3-flash-preview, deepseek-chat | yes |  | Exactly as the service writes them. |
| External services, formats and tokens | alt (the attribute) | alt | yes |  |  |
| External services, formats and tokens | og:image | og:image | yes |  |  |
| External services, formats and tokens | H1 / H2 | H1 / H2 | yes | العنوان الأول، عنوان من المستوى |  |
| External services, formats and tokens | meta tag | وسم meta | yes | وسم ميتا، الميتا |  |
| External services, formats and tokens | llms.txt / robots.txt / noindex | llms.txt / robots.txt / noindex | yes |  |  |
| External services, formats and tokens | Markdown / HTML | Markdown / HTML | yes | ماركداون |  |
| External services, formats and tokens | file formats and codes (PNG, JPG, SVG, UUID, hex) | PNG, JPG, SVG, UUID, #rrggbb | yes |  |  |
| External services, formats and tokens | brand and product names | B7R Print, بحر برنت | yes |  | The brand has both names; a product name is the catalogue’s. |
