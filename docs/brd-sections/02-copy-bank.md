## 4. Voice, terminology, and the copy bank

Writing rule (Dhia, 2026-09-13, ADR-040): no em dashes in any copy, search title or description, admin string or e-mail. Arabic uses «،» or a colon; English a comma, a colon or a new sentence. `pnpm check:dash` enforces it.

Every user-visible string in Level 1 is here. Copy it exactly, including punctuation. Strings in `{braces}` are variables. Where a string depends on a product, see Appendix A.

**Reading this section:** where a line reads `Title: text`, the colon is markdown structure separating a heading from its body text; it is never rendered on screen. The middle dot `·` between list items likewise means "separate elements", not a character to display. Arabic on-screen copy never contains an em dash (§4.1).

### 4.1 Voice and writing rules (for the rare new string)

- Register: **فصحى مبسطة** with a light, warm Saudi tone. Direct, numeric, confident. Entrepreneur to entrepreneur.
- Verbs first for actions ("ارفع تصميمك"), nominal phrases for headings and labels ("منطقة الطباعة").
- Never: قم بـ / القيام بـ, تم + مصدر, يرجى on routine instructions, بنجاح after obvious success, الخاص بك, هناك at sentence start, بشكل + adjective, English-order sentences, slashes for alternatives (use أو), decorative punctuation, em dashes.
- Gender: masculine imperative addressed to the merchant. Consistent everywhere.
- Numbers: Western digits. Currency amounts through `SarAmount`; in prose "30 ريالاً" where written so.
- Arabic comma «،» inside Arabic sentences. Question mark «؟». No exclamation marks except in the 404 page and the WhatsApp greeting.
- Length: buttons 1–3 words, titles 2–6 words, lead lines ≤ 15 words, FAQ answers ≤ 35 words.

### 4.2 Terminology (one term per concept)

| Concept | Use | Do not use |
|---|---|---|
| The service | الطباعة عند الطلب (in SEO text also "طباعة حسب الطلب" once per page) | برنت أون ديماند, طباعة تحت الطلب |
| The company | بحر برنت, or بحر in short friendly mentions | B7R alone in Arabic prose |
| The merchant's site | متجرك | موقعك, المتجر الإلكتروني الخاص بك |
| Platforms | سلة · زد · شوبيفاي | Salla/Zid/Shopify in Arabic prose (logos may show Latin) |
| Products | تيشيرت أساسي · تيشيرت أوفرسايز · هودي · بربتوز أطفال · حقيبة قماشية | قميص, سترة, شنطة |
| Money | التكلفة (من بحر) · سعر البيع · ربحك · المحفظة · رصيد ترحيبي | السعر الأساسي, الرسوم |
| Brand | براندك (CTA only, per Dhia) · علامتك التجارية (prose) | ماركتك |
| Register | أنشئ حسابك / ابدأ براندك مجاناً | سجّل الآن (allowed only in the ribbon lead) |
| Delivery | التوصيل, نوصّل | الشحن as the customer-facing verb (use شحن for the act B7R does) |

### 4.3 Global elements

**Navigation (in order, RTL start to end):** الرئيسية · المنتجات · كيف نعمل · من نحن · المدونة · تواصل معنا
**Header CTA:** ابدأ براندك مجاناً → `https://b7r.app/register?utm_source=b7r.sa&utm_medium=website&utm_campaign=header`
**Header secondary:** none. *Amended 2026-09-14 (Dhia, ADR-044): the login link is gone from the header, the menu and the CMS; the language switch (an icon, §6.2) sits before the CTA.*
**Skip link:** تخطَّ إلى المحتوى
**Menu button labels (aria):** فتح القائمة / إغلاق القائمة
**WhatsApp line (the error pages; the menu shows the icon, §6.2):** تواصل معنا عبر واتساب

### 4.4 Homepage

**Hero slides (image + headline + subline; 4 slides):**

| # | Headline (H1 on slide 1; H2-styled display on others) | Subline |
|---|---|---|
| 1 | علامتك التجارية تبدأ من قطعة واحدة | صمّمها وبِعها، ونحن نطبع ونشحن باسمك. |
| 2 | بدون رأس مال، بدون مخزون | نطبع فقط عند وصول الطلب، وتربح من أول قطعة. |
| 3 | من جدة إلى كل المملكة خلال 5 أيام | إنتاج محلي وشحن سريع، بدون جمارك ولا انتظار. |
| 4 | متجرك في سلة أو زد؟ اربطه بضغطة | الطلبات تصلنا تلقائياً، وتوصل عميلك باسم متجرك. |

**Hero primary CTA:** ابدأ براندك مجاناً → register URL with `utm_campaign=hero`
**Hero secondary CTA (text link with mirrored arrow):** استكشف المنتجات → `/products`
**Hero microcopy under the buttons:** رصيد ترحيبي 30 ريالاً، بدون بطاقة *(2026-09-13, Dhia: not shown in the hero any more; the line stays in the CMS for the About facts band)*
**Hero proof chips (0 to 6, with check icons; the seed ships 3):** مجاني 100% · بدون حد أدنى للطلبات · توصيل لكل المملكة خلال 5 أيام
**Slide indicator aria:** الشريحة {n} من 4 · **Pause aria:** إيقاف التبديل التلقائي / استئناف التبديل التلقائي

**Product strip section**
- Eyebrow: المنتجات
- H2: بحر من المنتجات
- Lead: بِعها في متجرك بدون أي مخزون.
- Card hover label: `{productName}` and price pill: يبدأ من `{SarAmount base}`
- Button: تصفح كل المنتجات → `/products`

**Interactive mockup and profit section**
- Eyebrow: جرّب بنفسك
- H2: شاهد تصميمك واحسب ربحك
- Lead: ارفع تصميمك، حرّكه على المنتج، وحدّد سعرك.
- Group labels: المنتج · اللون · التصميم · التسعير *(2026-09-13: «التسعير» no longer shown)*
- Upload button: ارفع تصميمك
- Upload helper: none (Dhia, 2026-09-14: the accepted types are not listed; a wrong file gets the error line)
- Sample design button: جرّب تصميماً جاهزاً *(removed 2026-09-13)*
- Replace design: غيّر التصميم
- Reset: إعادة الضبط
- Canvas hint (shown once, dismisses on first drag): اسحب التصميم لتحريكه، واستخدم الزوايا لتغيير الحجم.
- Base cost label: التكلفة من بحر
- Selling price label: سعر البيع في متجرك
- Recommended price helper: السعر المقترح `{SarAmount suggested}`
- Daily sales label: مبيعات يومية
- Result labels: ربحك لكل قطعة · ربحك الشهري التقديري
- Negative-profit warning: سعر البيع أقل من التكلفة. ارفع السعر لتربح.
- Footnote: تقدير لا يشمل الشحن والضريبة. *(removed 2026-09-13)*
- Section CTA: ابدأ بيع هذا المنتج → register URL with `utm_campaign=designer&product={slug}`
- File error: الملف غير مدعوم أو أكبر من 10 ميجابايت.

**Three steps section**
- Eyebrow: كيف نعمل
- H2: ثلاث خطوات وتبدأ
- Steps:
  1. صمّم منتجك: ارفع تصميمك وشاهده على المنتج فوراً.
  2. اربط متجرك: سلة أو زد أو شوبيفاي بضغطة واحدة.
  3. نطبع ونشحن: كل طلب يصلنا تلقائياً ويوصل عميلك باسم متجرك.
- Link under the steps: اعرف أكثر عن طريقة العمل → `/how-it-works`

**Video section**
- H2: شاهد كيف نطبع طلبك
- Lead: من ملف التصميم إلى الطرد الجاهز، كل شيء يحدث عندنا في جدة.
- Play button aria: تشغيل الفيديو

**Why us section**
- Eyebrow: لماذا بحر
- H2: لماذا يختارنا التجار؟
- Cards:
  1. بدون مخاطرة: صفر رأس مال، صفر مخزون، بدون حد أدنى للطلبات.
  2. كل شيء تلقائي: الطلبات تتزامن من متجرك وتُنفّذ بدون تدخل منك.
  3. جودة محلية وسريعة: طباعة في جدة وتوصيل لكل المملكة خلال 5 أيام.

**Testimonials section**
- Eyebrow: آراء التجار
- H2: تجار بدأوا معنا
- Sample cards (render only while `testimonials.placeholder = true`; each card carries a visible tag **نموذج** and the whole section is hidden in production until real content exists):
  1. «نموذج»: "ربطت متجري في سلة خلال دقائق، وأول طلب وصل عميلي خلال أربعة أيام.": اسم التاجر، اسم المتجر
  2. «نموذج»: "بدأت بدون أي مخزون، والآن عندي 12 تصميماً تبيع كل أسبوع.": اسم التاجر، اسم المتجر
  3. «نموذج»: "جودة الطباعة أفضل مما توقعت، والتغليف باسم متجري.": اسم التاجر، اسم المتجر

**Integrations section**
- H2: اربط متجرك بضغطة واحدة
- Lead: الطلبات تتزامن تلقائياً من متجرك إلى بحر.
- Tiles: سلة · زد · شوبيفاي, each with the tag متاح الآن
- Tile aria: ربط متجر {platform}

**FAQ section (5)**
- H2: الأسئلة الشائعة
- Items:
  1. كم أحتاج لأبدأ؟: لا شيء. تسجّل مجاناً وتحصل على 30 ريالاً رصيداً ترحيبياً.
  2. كيف أربح؟: تحدّد سعر البيع في متجرك. عند كل طلب نخصم تكلفة المنتج والشحن من محفظتك، والباقي ربحك.
  3. هل يعرف عميلي أن الطباعة من بحر برنت؟: لا. الطرد وبوليصة الشحن باسم متجرك فقط.
  4. كم يستغرق التوصيل؟: 5 أيام كحد أقصى لأي مدينة في السعودية.
  5. ما المتاجر التي أقدر أربطها؟: سلة وزد وشوبيفاي، والربط مجاني.
- Link: كل الأسئلة → `/faq`

**CTA ribbon (on every page, before the footer)**
- H2: ابدأ اليوم واحصل على 30 ريالاً رصيداً ترحيبياً
- Lead: سجّل مجاناً بدون بطاقة، وأطلق أول منتج خلال دقائق.
- Button: ابدأ براندك مجاناً → register URL with `utm_campaign=ribbon&utm_content={page}`

### 4.5 Footer

- Tagline under the white logo: منصة الطباعة عند الطلب في السعودية
- Column 1 title: روابط; items: الرئيسية · المنتجات · كيف نعمل · من نحن · المدونة · تواصل معنا
- Column 2 title: السياسات; items: الشروط والأحكام · الشحن والتوصيل · سياسة الخصوصية · الأسئلة الشائعة
- Column 3 title: النشرة البريدية; label: اشترك ليصلك الجديد; placeholder: name@example.com; button: اشترك; success: اشتركت. سنرسل لك الجديد فقط.; error: أدخل بريداً إلكترونياً صحيحاً.
- Contact line: contact@b7r.sa · 0501699572 (both LTR inside `<bdi>`; the number links to `tel:+966501699572`)
- Social aria labels: بحر برنت على X · بحر برنت على إنستغرام · بحر برنت على تيك توك · بحر برنت على واتساب
- Badges row caption (visually hidden, aria): وسائل الدفع وجهات التوثيق
- Misk line next to the Misk logo: خريجو برنامج Misk Launchpad، الدفعة 9، 2026 *(removed 2026-09-13; the logo stays)*
- Copyright: © {year} بحر برنت. جميع الحقوق محفوظة.

### 4.6 WhatsApp widget

- Floating button aria: تواصل معنا عبر واتساب
- Popup header title: بحر برنت; subtitle: فريق الدعم
- Greeting bubble: أهلاً 👋 كيف نقدر نساعدك؟
- Action button: ابدأ المحادثة
- Prefilled message: مرحباً، أرغب بمعرفة المزيد عن بحر برنت.
- Close aria: إغلاق

### 4.7 Consent bar

- Text: نستخدم ملفات تعريف الارتباط لتحسين تجربتك وقياس أداء الموقع.
- Buttons: موافق · رفض
- Link: سياسة الخصوصية → `/privacy`

### 4.8 Products pages

**Listing `/products`**
- H1: المنتجات
- Lead: منتجات بجودة عالية، تُطبع عند الطلب وتُشحن باسم متجرك.
- Card: `{name}` · يبدأ من `{SarAmount base}` · colour dots · sizes summary (e.g. S – 2XL)

**Detail `/products/{slug}`**
- Breadcrumb: الرئيسية › المنتجات › `{name}`
- H1: `{name}`
- Price block: التكلفة تبدأ من `{SarAmount base}` · سعر بيع مقترح `{SarAmount suggested}` · ربحك التقديري `{SarAmount suggested − base}` لكل قطعة
- Price footnote: تقدير لا يشمل الشحن والضريبة. أنت تحدّد سعر البيع. *(removed 2026-09-13)*
- Primary CTA: ابدأ بيع هذا المنتج → register URL with `utm_campaign=product&utm_content={slug}`
- Secondary link: جرّب تصميمك عليه → `/#designer?product={slug}`
- Section titles: الوصف · المواصفات · جدول المقاسات · منتجات أخرى *(2026-09-13: «الوصف» has no section of its own; the full description sits under the product name)*
- Spec labels: الخامة · الوزن · المقاسات · الألوان · منطقة الطباعة · طريقة الطباعة
- Print method value (all products): طباعة رقمية عالية الجودة
- Print area value: الواجهة الأمامية، 28 × 38 سم
- Size chart headers: المقاس · الطول · عرض الصدر · طول الكم (cm; see Appendix A)
- Size chart unit line (visible above the table, *2026-09-18*): القياسات بالسنتيمتر
- Colour switch aria: اللون {colour}
- Gallery aria: صورة {n} من {total}

### 4.9 How it works page `/how-it-works`

- H1: كيف تعمل الطباعة عند الطلب مع بحر؟
- Lead: نموذج عمل يتيح لك بيع منتجات مخصصة دون أن تطبعها أو تخزنها.
- Steps (5, each with a 3D icon):
  1. أنشئ حسابك مجاناً: سجّل خلال دقيقة واحصل على 30 ريالاً رصيداً ترحيبياً.
  2. اختر منتجك وصمّمه: ارفع تصميمك وشاهده على المنتج مباشرة، وحدّد سعر البيع.
  3. اربط متجرك: سلة أو زد أو شوبيفاي، بربط آمن وبدون مشاركة أي بيانات حساسة.
  4. انشر المنتج بضغطة: يُزامَن الاسم والصور والخيارات والسعر إلى متجرك تلقائياً.
  5. نطبع ونغلّف ونشحن: كل طلب يصلنا فور شرائه، نخصم التكلفة من محفظتك، ونشحنه باسم متجرك خلال 5 أيام كحد أقصى.
- Profit block title: كيف تُحسب أرباحك؟
- Equation tiles: سعر البيع − التكلفة الأساسية = ربحك
- Equation example line: مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة. (render the three numbers with `SarAmount`)
- Mini FAQ: reuse homepage FAQ items 2, 3, 4.
- CTA ribbon as usual.

### 4.10 About page `/about`

- H1: من نحن
- Story title: حكاية بدأت بتحدٍّ وتحوّلت إلى فرصة
- Story: وُلدت بحر برنت من تجربة مصمم حاول إطلاق علامته التجارية، فاصطدم بتكاليف مرتفعة وتعقيدات لوجستية عطّلت حلمه. تحوّل التحدي إلى فرصة لبناء حل محلي يفتح الباب لكل مبدع ورائد أعمال ليطلق منتجاته بأقل التكاليف. اليوم، بحر برنت منصة سعودية متكاملة تمكّن المؤثرين والمصممين وأصحاب الأفكار من تحويل إبداعاتهم إلى منتجات حقيقية تصل إلى عملائهم بسهولة واحترافية.
- Cards:
  - رسالتنا: تمكين أي شخص من إطلاق علامته التجارية بسهولة، عبر خدمة محلية للطباعة عند الطلب تشمل المنتجات والطباعة والتغليف والشحن، مع ربط ذكي بمتجره.
  - رؤيتنا: أن نكون الشريك الأول للمبدعين ورواد الأعمال في السعودية والخليج لإطلاق منتجاتهم المطبوعة، وأن نسهم في اقتصاد إبداعي مستدام يقوم على حلول تقنية محلية.
  - قيمنا: الإبداع الذي يحوّل الأفكار إلى منتجات، والتمكين الذي يمنح كل مبدع بداية بلا مخاطرة، والجودة التي نلتزم بها في الطباعة والتغليف.
- Misk block title: خريجو برنامج Misk Launchpad
- Misk block text: بحر برنت من خريجي الدفعة التاسعة (2026) من برنامج Misk Launchpad، برنامج ما قبل التسريع من مؤسسة محمد بن سلمان «مسك».
- Location line: نطبع ونشحن من جدة إلى كل مدن المملكة.

### 4.11 Contact page `/contact`

- H1: تواصل معنا
- Lead: تاجر، شريك، أو مستثمر؟ نرد على الجميع.
- Form labels: الاسم · رقم الجوال · البريد الإلكتروني · نوع الاستفسار · رسالتك
- Placeholders: (name) اسمك الكامل · (phone) 05XXXXXXXX · (email) name@example.com · (message) اكتب رسالتك هنا
- Inquiry options: تاجر · شراكة · استثمار · أخرى
- Submit: أرسل الرسالة
- Sending state: جارٍ الإرسال
- Success: وصلتنا رسالتك. سنرد عليك قريباً.
- Failure: تعذّر الإرسال. حاول مرة أخرى أو راسلنا على واتساب.
- Validation: أدخل اسمك · أدخل رقم جوال صحيح · أدخل بريداً إلكترونياً صحيحاً · اختر نوع الاستفسار · اكتب رسالتك
- Contact cards: واتساب; راسلنا مباشرة · البريد الإلكتروني: contact@b7r.sa · الهاتف: 0501699572 · تابعنا: (social icons)
- Booking card title: احجز استشارة مجانية
- Booking card text: 30 دقيقة نجاوب فيها على أسئلتك ونساعدك تبدأ.
- Booking button: احجز موعدك (opens `bookingUrl`; if unset, opens WhatsApp with the message: مرحباً، أرغب بحجز استشارة مجانية.)

### 4.12 FAQ page `/faq`

- H1: الأسئلة الشائعة
- Lead: كل ما تحتاج معرفته قبل أن تبدأ.
- Groups and items: Appendix D.
- Bottom line: لم تجد إجابتك؟ راسلنا على واتساب.

### 4.13 Blog `/blog` (Level 1 placeholder)

- H1: مدونة بحر
- Lead: أدلة عملية لبدء براندك وبيع منتجاتك المطبوعة في السعودية.
- Hub names (6): البداية · أساسيات الطباعة عند الطلب · سلة وزد وشوبيفاي · التصميم · التسعير والربح · المواسم
- Post meta: كتبه {author} · {date} · {n} دقائق قراءة (*amended 2026-09-18: `{author}` is the name on the post's author record, the same name the author card, the feed and the JSON-LD carry; it read «ضياء» as a fixed word before*)
- Key takeaways box title: أهم النقاط
- Related title: مقالات ذات صلة
- Share: شارك
- In-post CTA block: title ابدأ براندك اليوم; text بدون رأس مال وبدون مخزون.: button ابدأ براندك مجاناً
- Placeholder posts (3, marked as samples in the CMS data, real content to come in Level 3):
  1. كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون
  2. ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية
  3. كيف تسعّر تيشيرت مطبوع في السعودية؟

### 4.14 Legal pages

- Titles: الشروط والأحكام · الشحن والتوصيل · سياسة الخصوصية
- Updated line: آخر تحديث: {date}
- Bodies: Appendix B, verbatim.

### 4.15 404 page

- H1: الصفحة غير موجودة
- Text: يبدو أن الرابط تغيّر أو حُذف.
- Button: العودة للرئيسية

### 4.16 SEO titles and descriptions (Arabic; the brand suffix is added by the template as « | بحر برنت»)

The English titles and descriptions (suffix ` | B7R Print`) are the `seo` rows of Appendix I and the English `seo-defaults` values the seed writes (Level 5, ADR-043).

| Page | `<title>` (without suffix) | Meta description |
|---|---|---|
| Home | بحر برنت: منصة الطباعة عند الطلب في السعودية | ابدأ براندك بدون رأس مال أو مخزون. صمّم منتجاتك، اربط متجرك في سلة أو زد أو شوبيفاي، ونحن نطبع في جدة ونشحن باسمك خلال 5 أيام. |
| Products | منتجات الطباعة عند الطلب | تيشيرتات، هودي، بربتوز أطفال، وحقائب قماشية تُطبع عند الطلب وتُشحن باسم متجرك. الأسعار تبدأ من 30 ريالاً. |
| Product (each) | {name} للطباعة عند الطلب | {short description}. التكلفة تبدأ من {base} ريالاً، بدون حد أدنى، وشحن باسم متجرك. |
| How it works | كيف تعمل الطباعة عند الطلب مع بحر | خمس خطوات من إنشاء الحساب إلى وصول الطلب لعميلك: صمّم، اربط متجرك، انشر، ونحن نطبع ونشحن باسمك. |
| About | من نحن | قصة بحر برنت، أول منصة سعودية للطباعة عند الطلب، من خريجي برنامج Misk Launchpad. |
| Contact | تواصل معنا | راسلنا على واتساب أو البريد، أو احجز استشارة مجانية لمدة 30 دقيقة. |
| FAQ | الأسئلة الشائعة عن الطباعة عند الطلب | إجابات مباشرة عن التكلفة والربح والتوصيل وربط المتاجر مع بحر برنت. |
| Blog | مدونة بحر | أدلة عملية لبدء براندك وبيع المنتجات المطبوعة في السعودية: التسعير والربح وربط متجرك بسلة وزد وشوبيفاي. |
| Terms | الشروط والأحكام | شروط استخدام منصة بحر برنت: التسجيل والطلبات والأسعار والدفع وحقوق التصاميم والإلغاء. |
| Shipping | الشحن والتوصيل | سياسة الشحن والتوصيل في بحر برنت داخل المملكة: التوصيل خلال 5 أيام، ومحاولات التسليم، والتعويض خلال 10 أيام من الاستلام. |
| Privacy | سياسة الخصوصية | كيف نجمع بياناتك ونستخدمها ونحميها في بحر برنت، ومدة الاحتفاظ بها، وحقوقك عليها. |
| Compare (Printful) | بحر برنت مقابل Printful لمتجر سعودي | مقارنة بالأرقام: الطباعة في جدة والتوصيل خلال 5 أيام مقابل الشحن من الخارج خلال أسابيع؛ الأسعار بالريال وربط سلة وزد. |
| Book (`/book`, §4.19, draft for Dhia's read) | احجز استشارة مجانية | اختر يوماً وموعداً يناسبك: 30 دقيقة على Google Meet نجاوب فيها على أسئلتك ونساعدك تبدأ براندك. |

### 4.17 Transactional emails (Level 1, sent through Resend)

- Contact notification to contact@b7r.sa: subject: رسالة جديدة من الموقع: {inquiryType}; body lists all fields, LTR-safe formatting for phone and email, plus a "رد عبر واتساب" link if the phone is Saudi.
- Newsletter: no welcome email in Level 1; the address is added to a Resend audience named "b7r.sa newsletter".
- Booking e-mails (Level 4, ADR-062): the merchant's confirmation, move, cancel, the two reminders and the link that follows a calendar failure, and Dhia's pair of each at the contact address, in the merchant's language; the wording is §4.19's second table, the time reads in Riyadh with Western digits, the confirmation and the move attach the calendar file.

### 4.18 The compare page `/compare-printful` (ADR-050, approved by Dhia 2026-09-16)

A comparison with Printful for a Saudi merchant, one `compare` block. The claims about Printful were read on its public pages on 2026-09-16 and are named on the page as text; the page links nowhere outside (§7.9). B7R’s side repeats §1.1 in words; when those facts change, the rows change the same day.

| Field | Arabic |
|---|---|
| Title (H1) | بحر برنت مقابل Printful: أيهما أنسب لمتجر سعودي؟ |
| Lead | مقارنة بالأرقام لتاجر يبيع في السعودية: من أين تُطبع القطعة، متى تصل، وكم تكلّف. |
| Intro | الجدول يقارن ما يهم التاجر السعودي أولاً: مكان الطباعة، مدة التوصيل، الحد الأدنى، السعر بالريال، وربط المتجر. أرقام بحر برنت من الموقع نفسه؛ أرقام Printful من صفحاته العامة بتاريخ القراءة المذكور أسفل الجدول. |
| Our column | بحر برنت |
| Their column | Printful |
| Row: أين تُطبع القطعة | جدة · خارج المملكة، بحسب المنتج |
| Row: مدة التوصيل إلى الرياض أو جدة | حتى 5 أيام من استلام الطلب، شاملة الطباعة · من أسبوعين إلى أربعة أسابيع، شحناً دولياً |
| Row: الرسوم الجمركية على عميلك | لا شيء: الشحن داخل المملكة · قد تُفرض عند الوصول ويدفعها المستلم |
| Row: الحد الأدنى للطلب | قطعة واحدة · قطعة واحدة |
| Row: تكلفة تيشيرت أساسي مطبوع | تبدأ من 45 ريالاً، السعر معلن · بالدولار، يُضاف إليها الشحن الدولي والضريبة عند الوصول |
| Row: ربط المتجر | سلة وزد وشوبيفاي بضغطة · شوبيفاي ومتاجر عالمية؛ لا تطبيق لسلة أو زد |
| Row: الفاتورة وضريبة القيمة المضافة | فاتورة سعودية بضريبة القيمة المضافة · فاتورة أجنبية بلا ضريبة سعودية |
| Row: لغة الدعم | العربية على واتساب · بلا دعم عربي |
| Best for 1 | تاجراً على سلة أو زد تريد أن يصل الطلب لعميلك خلال أيام لا أسابيع |
| Best for 2 | تبدأ براندك بقطعة واحدة بلا مخزون ولا رأس مال |
| Best for 3 | تريد فاتورة سعودية وسعراً بالريال معلناً قبل أن تبيع |
| Not best for 1 | تبيع خارج السعودية أساساً، أو تريد كتالوجاً من مئات المنتجات |
| Not best for 2 | تحتاج طلبية كبيرة بمئات القطع بسعر الجملة |
| Closing | الخلاصة: لتاجر يبيع داخل السعودية، بحر برنت يطبع في جدة ويوصّل خلال 5 أيام باسمك وبفاتورة سعودية؛ Printful خيار لمن يبيع للخارج أو يريد كتالوجاً أوسع. جرّب بقطعة واحدة ورصيد ترحيبي 30 ريالاً. |

The rows are written as "criterion | ours · theirs"; each cell is one string on the page.

The block’s fixed words (`content/copy/ar.ts`, `compare`):

| Key | Arabic |
|---|---|
| `caption` | مقارنة بين {ours} و{theirs} |
| `criterion` | المعيار |
| `bestFor` | الأنسب لك {ours} إذا كنت |
| `notBestFor` | ليس {ours} الأنسب إذا كنت |
| `asOf` | قُرئت صفحات {theirs} في |
| `asOfTail` | ؛ الأرقام تتغير، وتاريخ القراءة يبقى صادقاً. |

SEO row (§4.16): route `/compare-printful`, title «بحر برنت مقابل Printful لمتجر سعودي», description «مقارنة بالأرقام: الطباعة في جدة والتوصيل خلال 5 أيام مقابل الشحن من الخارج خلال أسابيع؛ الأسعار بالريال وربط سلة وزد.».

### 4.19 The booking page `/book` and its e-mails (ADR-062, ADR-063; a draft for Dhia's read, `TODO(copy)`)

Bookings are built inside b7r.sa (no Cal.com): the page `/book` and the contact page's booking card hold one booker (ADR-063), a card in three panes. The event pane says who the merchant meets (the host's photo, name and role from the author record), the consultation's name, the blurb, the length, «Google Meet» and «توقيت الرياض (GMT+3)». The calendar pane is a month grid, Sunday first, with the open days marked. The times pane lists the day's free times with Western digits and ص/م; a tap splits the time into the time and «أكّد». The form takes the merchant's name, phone, e-mail and optional notes, then the success view lists what, when, with whom and where, offers «أضف إلى التقويم» (Google, Outlook, Apple) and the way to change or cancel. The manage page `/book/manage` (by the signed link in the confirmation e-mail) moves or cancels the booking in the same card. The name, phone and e-mail labels, placeholders and validation are §4.11's. Written under §0.5's fallback rule and listed in `TODO_COPY` of the verbatim test until Dhia approves; then the markers go and this section is the check.

The page and the booker (`content/copy/ar.ts`, `booking`):

| Key | Arabic |
|---|---|
| `title` | احجز استشارة مجانية |
| `lead` | 30 دقيقة على Google Meet نجاوب فيها على أسئلتك ونساعدك تبدأ. |
| `riyadhTime` | بتوقيت الرياض |
| `timezone` | توقيت الرياض (GMT+3) |
| `googleMeet` | Google Meet |
| `duration` | {minutes} دقيقة |
| `pickDay` | اختر اليوم |
| `pickTime` | اختر الوقت |
| `previousMonth` | الشهر السابق |
| `nextMonth` | الشهر التالي |
| `today` | اليوم |
| `loadingDays` | جارٍ تحميل الأيام |
| `loadingSlots` | جارٍ تحميل المواعيد |
| `noSlots` | لا مواعيد متاحة في هذا اليوم. اختر يوماً آخر. |
| `closed` | مغلق: {reason} |
| `confirm` | أكّد |
| `back` | رجوع |
| `chosen` | موعدك: {day}، {time} |
| `note` | ملاحظات إضافية (اختياري) |
| `notePlaceholder` | ما الذي تريد أن نناقشه؟ |
| `submit` | أكّد الحجز |
| `submitting` | جارٍ الحجز |
| `taken` | حُجز هذا الموعد للتو. اختر موعداً آخر. |
| `failure` | تعذّر الحجز. حاول مرة أخرى أو راسلنا على واتساب. |
| `confirmedTitle` | موعدك محجوز |
| `confirmedText` | أرسلنا التفاصيل إلى بريدك. |
| `what` | ماذا |
| `when` | متى |
| `who` | مع من |
| `where` | أين |
| `notes` | ملاحظاتك |
| `meetLink` | رابط الاجتماع |
| `linkFollows` | الرابط يصلك على بريدك قبل الموعد. |
| `addToCalendar` | أضف إلى التقويم |
| `googleCalendar` | تقويم Google |
| `outlookCalendar` | تقويم Outlook |
| `appleCalendar` | تقويم Apple |
| `needChange` | تحتاج تغييراً؟ |
| `manageLink` | غيّر الموعد أو ألغِه |
| `manageTitle` | إدارة حجزك |
| `manageLead` | غيّر موعد استشارتك أو ألغِه من هنا. |
| `status.booked` | محجوز |
| `status.rescheduled` | مُعاد جدولته |
| `status.cancelled` | ملغى |
| `status.completed` | مكتمل |
| `current` | موعدك الحالي |
| `reschedule` | غيّر الموعد |
| `confirmReschedule` | أكّد التغيير |
| `cancel` | ألغِ الحجز |
| `cancelTitle` | إلغاء الحجز؟ |
| `cancelText` | يُلغى موعدك ويُحذف من التقويم، ويصلك بريد بذلك. تقدر تحجز موعداً آخر متى شئت. |
| `keep` | أبقِ الموعد |
| `rescheduled` | تغيّر موعدك. أرسلنا التفاصيل الجديدة إلى بريدك. |
| `cancelled` | أُلغي حجزك. نرحّب بك في موعد آخر متى شئت. |
| `past` | انتهى هذا الموعد. احجز موعداً جديداً متى شئت. |
| `tooLate` | لا يمكن تغيير الموعد قبل أقل من {hours} ساعة منه. راسلنا على واتساب. |
| `invalid` | هذا الرابط غير صالح. راسلنا على واتساب ونساعدك. |
| `bookAgain` | احجز موعداً جديداً |
| `whatsappMessage` | مرحباً، أرغب بحجز استشارة مجانية. |

The booking settings (§11.2) add two content fields the booker reads: the **host**, an author record (the seed's is Dhia's), and the **blurb** under the consultation's name: «نجاوب على أسئلتك ونساعدك تبدأ» / "We answer your questions and help you start".

The e-mails (`content/copy/ar.ts`, `bookingEmail`): `{name}` is the merchant, `{title}` the consultation's name from the booking settings, `{when}` the time in Riyadh.

| Key | Arabic |
|---|---|
| `confirmSubject` | موعدك محجوز: {title} |
| `confirmIntro` | مرحباً {name}، موعدك محجوز. |
| `when` | الموعد |
| `meet` | رابط الاجتماع |
| `linkFollows` | رابط الاجتماع يصلك في بريد آخر قبل الموعد. |
| `manage` | غيّر الموعد أو ألغِه من هنا |
| `calendarFile` | ملف التقويم مرفق بهذا البريد. |
| `reminder24Subject` | تذكير: استشارتك غداً |
| `reminder1Subject` | تذكير: استشارتك بعد ساعة |
| `reminderIntro` | مرحباً {name}، نذكّرك بموعد استشارتك. |
| `rescheduledSubject` | تغيّر موعدك: {title} |
| `rescheduledIntro` | مرحباً {name}، تغيّر موعد استشارتك. |
| `cancelledSubject` | أُلغي حجزك: {title} |
| `cancelledIntro` | مرحباً {name}، أُلغي حجز استشارتك. نرحّب بك في موعد آخر متى شئت. |
| `linkSubject` | رابط اجتماعك: {title} |
| `linkIntro` | مرحباً {name}، هذا رابط اجتماعك. |
| `bookAgain` | احجز موعداً آخر |
| `newSubject` | حجز جديد: {name}، {when} |
| `newIntro` | حجز جديد من الموقع. |
| `calendarFailed` | تعذّر تسجيل الموعد في تقويم Google؛ يُعاد الطلب تلقائياً ثلاث مرات. |
| `ownerRescheduledSubject` | تغيّر موعد: {name}، {when} |
| `ownerCancelledSubject` | أُلغي حجز: {name}، {when} |
| `ownerReminder24Subject` | تذكير: استشارة {name} غداً، {when} |
| `ownerReminder1Subject` | تذكير: استشارة {name} بعد ساعة |
| `ownerLinkSubject` | رابط الاجتماع جاهز: {name}، {when} |
| `noteLabel` | ملاحظة التاجر |
| `pageLabel` | حُجز من |
| `openInPanel` | افتح الحجز في اللوحة |

SEO row (§4.16): route `/book`, title «احجز استشارة مجانية», description «اختر يوماً وموعداً يناسبك: 30 دقيقة على Google Meet نجاوب فيها على أسئلتك ونساعدك تبدأ براندك.».
