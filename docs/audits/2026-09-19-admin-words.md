# Admin words pass (2026-09-19)

PR 2 of the Arabic panel plan (`docs/plans/2026-09-19-arabic-panel-2.md`): the glossary, the
trim, the Arabic by meaning. Dhia's brief: "meaning-based rather than purely literal
translations; keep technical terms and external elements (like APIs) in English where
appropriate; review and trim unnecessary text before translating: helpful hints stay,
unhelpful or redundant copy goes; this applies to all future features."

## Counts

| What | Number |
|---|---|
| Arabic sentences the glossary gate now reads, every run | 1,660: 1,055 config texts (411 descriptions, 512 labels, 72 select options, 30 tabs, 5 collapsibles, 24 header sentences, 1 empty-state), 327 leaves of the strings tree, 198 Payload overrides, 80 visibility-rule sentences |
| Field descriptions in the maps | 320 before, 353 after (33 sentences moved in from inline config text and the six home-page section switches; no field lost its sentence) |
| English descriptions rewritten | 276 of 320 (254 shorter); 28,339 characters to 23,564, 17% less |
| Arabic descriptions rewritten | 299 of 320 (268 shorter); 23,092 characters to 19,152, 17% less |
| Descriptions over 140 characters | 29 before, 0 after, measured on the rendered text (a bilingual list may exceed the cap by its one-clause shared-rows note: the longest rendered Arabic is 148 characters, `home.hero.slides`, 140 plus its note, the allowance); `CAP_EXCEPTIONS` is empty |
| Arabic descriptions that opened with a bare place preposition («في البطاقة…», «تحت العنوان…») | 83 after the first pass (the CTO review counted 120: each bilingual pair twice), 0 on the merged head: each got its verb («يظهر في البطاقة…», «تظهر خلف الشريحة…», «يعلو شبكة البطاقات…»); 96 of the 411 open with their verb, the rest are spec sentences or switches |
| Config labels, options, tab and entity sentences changed | 61 English, 67 Arabic (the moves included) |
| Visibility rules' sentences changed | 3 English, 8 Arabic (the tagline, the search data, «مطلوب», «أهم النقاط») |
| Strings tree leaves changed | 16 pairs (the on/off pair, the desktop, the image rows, the ledger and score help, the traffic notes; `nav.*` untouched, it is PR 1's) |
| Glossary rows | 183 (31 Latin-kept terms, 233 refused forms); no two rows share an Arabic word, so «سؤال» is one row for the FAQ entry and the buyer prompt, «قسم» one row for a page section and a blog hub, «تنبيه» one row for a notification and a warning, and the backlog is «قائمة المواضيع» beside the site menu’s «القائمة» |
| Site copy (`src/content/copy/ar.ts`), reported and never gated | 205 strings read, 16 differences: «واتساب» (8), «السعر المقترح» (3), «إنستغرام», «تيك توك», «شوبيفاي», «ملفات تعريف الارتباط» (2); BRD-verbatim, left as they are |
| New gates | `tests/admin-glossary.test.ts` (144 tests); the description rule in `tests/admin-config.test.ts`: the 140 cap on the rendered text, the label-noun check, the storage-word check, the place-fragment check; the ux-araby rules now run over every config text (`tests/admin-strings.test.ts` reads `configTexts()`, the plugin’s redirects included, which caught a bare «/» in a redirect sentence) |

## The rule, applied

A description is one sentence of what the field does on the site and where, then the limit or
an example if one helps a decision; nothing the label already says (a description never opens
with the label's own noun), nothing about how it is stored, no second sentence that repeats the
first. The English was written first and trimmed; the Arabic was written by meaning under
ux-araby, glossary words Latin (WhatsApp, Search Console, JSON, the model ids), the settled
word everywhere else (the tagline is «الجملة التعريفية», a run is «جولة», the AI vendor is
«الخدمة», a limit is «الحد», a switch is «مفعّل» / «معطّل», the desktop is «الحاسوب»). An
Arabic sentence that says where the value shows opens with its verb, the field the implied
subject and the gender agreeing with it; a spec sentence (a limit, a format, an example) may
stay nominal.

## Eleven before and after

| Where | Before (en) | After (en) | Before (ar) | After (ar) |
|---|---|---|---|---|
| Products, Name | The product's name on its card, its page title, the designer's picker and llms.txt. | On the card, the page title, the designer's picker and llms.txt. | اسم المنتج كما يظهر في البطاقة، وعنوان صفحته، وقائمة المصمّم، وملف llms.txt. | يظهر في البطاقة، وعنوان صفحته، وقائمة المصمّم، وملف llms.txt. |
| Products, Chest (cm) | The chest width in centimetres in the size table. Empty on every size hides the column. | In centimetres, on the product's page. Empty on every size hides it. | عرض الصدر بالسنتيمتر في جدول المقاسات. فارغ في كل المقاسات يخفي العمود. | بالسنتيمتر في صفحة المنتج. فارغ في كل المقاسات يخفيه. |
| Pages, Line under the title | One line under the title, in a lighter weight. Empty hides the line. | One line under the title, in a lighter weight. Empty hides it. | سطر واحد تحت العنوان، بخط أخف. فارغ يخفي السطر. | يظهر تحت العنوان بخط أخف؛ فارغ يخفيه. |
| Connections, API key | The key from the service's console; for Search Console, the service account's JSON file. Stored encrypted and never shown again; leave the mask to keep it. | From the service's console; for Search Console, the service account's JSON file. Never shown again; leave the mask to keep it. | المفتاح من لوحة الخدمة؛ لـ Search Console ملف حساب الخدمة (JSON). يُحفظ مشفّراً ولا يُعرض ثانية؛ اترك القناع للإبقاء عليه. | من لوحة الخدمة؛ ولـ Search Console ملف حساب الخدمة (JSON). لا يُعرض ثانية؛ اترك القناع للإبقاء عليه. |
| Site settings, WhatsApp digits | The WhatsApp digits, no + and no spaces, for the wa.me link in the widget and every WhatsApp button: 966501699572. | No + and no spaces, for the wa.me link in the widget and every WhatsApp button: 966501699572. | أرقام واتساب بلا + ولا مسافات، لرابط wa.me في الأداة وكل أزرار واتساب: 966501699572. | بلا + ولا مسافات، لرابط wa.me في الأداة وكل أزرار WhatsApp: 966501699572. |
| Site settings, Tagline | The one-line definition: under the logo in the footer, the first line in llms.txt, the web app manifest, and the engine's facts sheet. The same sentence everywhere. | One sentence, the same everywhere: under the logo in the footer, the first line of llms.txt, the app manifest, the facts sheet. | الجملة التعريفية الواحدة: تحت الشعار في التذييل، السطر الأول في llms.txt، بيان التطبيق، وورقة حقائق المحرّك. الجملة نفسها في كل مكان. | تُقرأ كما هي في كل مكان: تحت الشعار في التذييل، وأول llms.txt، وبيان التطبيق، وورقة الحقائق. جملة واحدة. |
| Home page, Main button | The blue button under the slides; opens the app's sign-up. Shiny or classic: Site settings, Brand, Shiny buttons. | (unchanged) | نص الزر الأزرق تحت الشرائح؛ يفتح تسجيل حساب في التطبيق. لامع أو كلاسيكي: إعدادات الموقع ← العلامة ← أزرار لامعة. | يظهر أزرق تحت الشرائح ويفتح تسجيل حساب في التطبيق. لامع أو كلاسيكي: إعدادات الموقع، العلامة، أزرار لامعة. |
| Engine settings, Daily cost limit (USD) (was "Daily cost cap") | The most the engine may spend in a day, in USD (estimated from the connection's rates); a run is refused once reached, until tomorrow. The monthly limit sits on the connection itself. | Estimated from the connection's rates; reached, a run is refused until tomorrow. The monthly limit sits on the connection. | أقصى إنفاق يومي بالدولار (تقديري من أسعار الاتصال)؛ التشغيل يُرفض بعد بلوغه حتى الغد. الحدّ الشهري على صفحة الاتصال نفسه. (label «سقف التكلفة اليومي») | تقديري من أسعار الاتصال؛ عند بلوغه تُرفض الجولة حتى الغد. الحد الشهري على الاتصال نفسه. (label «الحد اليومي للتكلفة») |
| Buyer questions, Ask every (days) | How often this prompt is asked: 7 weekly (the seed), 1 every morning, 30 monthly. With web search on, one ask costs about $0.02 on OpenAI, $0.01 on Gemini Flash and $0.03 on Claude Haiku: a weekly prompt is about $0.30 a month across the three, a daily one about $2. | 7 weekly, 1 daily, 30 monthly. With web search an ask costs about $0.02 on OpenAI, $0.01 on Gemini Flash and $0.03 on Claude Haiku. | كل كم يوماً يُسأل هذا السؤال: 7 كل أسبوع (البذرة)، 1 كل صباح، 30 كل شهر. مع البحث على الويب يكلّف السؤال الواحد نحو 0.02 دولار على OpenAI و0.01 على Gemini Flash و0.03 على Claude Haiku: سؤال أسبوعي نحو 0.30 دولار شهرياً عبر الثلاثة، واليومي نحو دولارين. | 7 كل أسبوع، 1 كل يوم، 30 كل شهر. مع البحث على الويب يكلّف السؤال نحو 0.02 دولار على OpenAI و0.01 على Gemini Flash و0.03 على Claude Haiku. |
| Search defaults, Verification tokens | The tokens Google Search Console and Bing Webmaster Tools gave you to prove ownership (meta tags on the home page). Empty uses the environment variables. | Prove ownership to Google Search Console and Bing Webmaster Tools (meta tags on the home page). Empty keeps the ones set with the hosting. | الرمزان اللذان أعطتهما Google Search Console وBing Webmaster Tools لإثبات الملكية (وسما meta في الرئيسية). فارغ يستخدم متغيّرات البيئة. | تثبت الملكية لـ Google Search Console وBing Webmaster Tools (وسما meta في الرئيسية). فارغة تُبقي ما ضُبط مع الاستضافة. |
| Score page, rule I1 title | The tagline exists in English | (unchanged) | الشعار النصي مكتوب بالإنجليزية | الجملة التعريفية مكتوبة بالإنجليزية |

## Left as is, and why

- **Payload's own Arabic** (`payload-ar.ts`, 198 overrides): already under the ux-araby rules
  and the glossary; nothing to trim.
- **`nav.*` strings**: PR 1's (the header switch) on a sibling branch.
- **Salla, Zid and Misk in Arabic** («سلة», «زد», «مسك»): the brands' own Arabic names, as
  the site shows them; the glossary says so. Shopify has none, so it is Latin now.
- **«قسم» for a blog hub and for a page section**: the audit settled «قسم» for the hub; a page
  form and a post form never show both, so the word does not collide where an editor reads it.
- **«نموذج» for a sample testimonial and «نموذج التواصل» for the contact form**: the sample
  label carries its explainer in brackets; the e2e asserts the badge.
- **The "Generate (not wired yet)" cover-source option**: the value is stored and typed;
  removing it is a data decision, not a words one.
- **A connection's last test message** and the run's error: records in the service's own
  terms, never sentences for a reader (ADR-056), untranslated on purpose.
- **The home switches' English** ("Off hides the “Three steps” section from the home page"):
  the e2e asserts the sentence; the Arabic is the design system's own example.
- **Validation messages and `Refused` reasons**: read; short, verb-first, in both languages
  already; no gate reaches inside a validator's closure (rule 16 names it as the known gap:
  a regex over `src/` for `inLanguage(` literals would feed them to the checks). The one
  bare «/» in a redirect sentence was quoted by hand («يبدأ بـ «/» أو رابط https://»).
- **The site's copy**: 16 glossary differences printed by the test, all BRD-verbatim
  («واتساب», «السعر المقترح», «إنستغرام»); Dhia's words, never gated.
