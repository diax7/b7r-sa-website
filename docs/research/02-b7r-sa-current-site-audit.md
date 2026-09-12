# Current b7r.sa Site Audit — 2026-09-12

> Research report generated 2026-09-12 by a background agent (live fetch of every page). Input for the B7R marketing-site BRD. Not the BRD itself. Verbatim Arabic copy is preserved for reuse.

Method: raw HTML via curl (all pages HTTP 200), clean text via Exa, Elementor kit/page CSS, images viewed directly.

## 1. Sitemap

**Platform:** WordPress 6.8.8, theme **The7 v12.8.1** (+ The7 Core 2.7.12), **Elementor 4.1.4 + Elementor Pro**, The Plus Addons, Essential Addons, Fluent Forms, All in One SEO Pro 4.8.3.2, Site Kit 1.187.0, MonsterInsights (GA4 `G-JPB02M7C49`). Hosted on **Hostinger** (LiteSpeed cache, hCDN, PHP 8.2.33). `http://` and `www.` both 301 to `https://b7r.sa/`.

**Language:** every page is `<html dir="rtl" lang="ar">`. **No English version exists** — `/en/` is 404, no hreflang, no i18n plugin, no language switcher. Page `<title>`s use English WP slugs ("About", "Contact", "Showcase", "Blog").

**Header nav:** الرئيسية → `/` · من نحن → `/about/` · منتجاتنا → `/showcase/` · تواصل معنا → `/contact/` · pill button **جرب الآن مجانًا → `/contact/`** · search icon (English "Clear / Search") · hamburger (navy full-screen menu).

**Live, linked pages**

| URL | `<title>` | Nav label |
|---|---|---|
| https://b7r.sa/ | بحر برنت \| B7R Print - منصة الطباعة عند الطلب في السعودية | الرئيسية |
| https://b7r.sa/about/ | About - بحر برنت \| B7R Print | من نحن |
| https://b7r.sa/showcase/ | Showcase - بحر برنت \| B7R Print | منتجاتنا |
| https://b7r.sa/contact/ | Contact - بحر برنت \| B7R Print | تواصل معنا / CTA |
| https://b7r.sa/terms-conditions/ | الشروط والأحكام - بحر برنت \| B7R Print | footer |
| https://b7r.sa/shipping/ | الشحن والتوصيل - بحر برنت \| B7R Print | footer |
| https://b7r.sa/privacy-policy/ | سياسة الخصوصية - بحر برنت \| B7R Print | footer |

**Not linked but live and indexable (none noindexed):**
- `/blog/` — "Hello world!" plus 10 lorem-ipsum posts (`/post001/` … `/post012/`, 2019 dates). Meta description says "المدونة قريبًا..." while the page shows lorem ipsum.
- The7 demo leftovers: `/home-2/`, `/team/`, `/our_services/`, `/under-construction/`, `/demo-design-system/`, `/specialists/` + 6 fake people ("James Richardson", "Jacob Freeman", "Diana Green", "Jessica Brown", "Alexa Jameson", "William Green"), `/project/` + 10 fake projects ("Code Lab", "Atica Agency", "Utosia", "Kyan", "Ztos Development", "Amara", "Fossa Group", "Treva", "Light AI", "Hex Lab"), `/services/brand-identity/`, `/services/social-media-marketing/`, `/services/project-management/`, `/project-category/{it,retail,business}/`, `/category/{uncategorized,design,economy,news}/`.
- Total ≈ 52 URLs in the sitemap index; only 7 are real.

**Missing:** no FAQ page, no "how it works" page, no pricing page, no English pages.

## 2. Copy extraction (verbatim Arabic)

### Homepage hero (h3 — there is no h1 on any page)
**Headline:** بحر من المنتجات بين يديك
**Sub:** اختر من العديد من المنتجات القابلة للطباعة لتبدأ علامتك التجارية على الفور. كل منتج يمكنك تخصيصه بتصاميمك الخاصة، وبيعه مباشرة من خلال متجرك الإلكتروني.
**CTA:** جرب الآن مجانًا → `/contact/`
Hero image: stock "YOUR LOGO HERE" apparel-in-cubes mockup.

### Value propositions ("لماذا بحر برنت؟") — identical on Home and About
**Sub:** القيمة المضافة اللي تحتاجها لبداية مشروعك
1. **بدون رأس مال ولا مخزون** — نطبع عند الطلب فقط، وهذا يلغي الحاجة لتخزين المنتجات أو استثمار مبالغ كبيرة في البداية.
2. **تكامل سهل مع متجرك** — كل الطلبات تُنفذ تلقائيًا، مما يوفر وقتك وجهدك ويزيد كفاءة عملياتك بربط مباشر وسلس مع متجرك الإلكتروني.
3. **بدون حد أدنى للطلبات** — لا نطلب كميات كبيرة لبدء الإنتاج، مما يجعل اختبار الأفكار وإطلاق المنتجات أسرع وأسهل.
4. **دعم شامل بالعربية** — من الدعم الفني، إلى الاستشارات الطباعية، نحن شريكك المحلي المهتم بنجاحك.

### Products section header
**Title:** بحر من المنتجات متوفرة بين يديك
**Sub:** بيعها على متجرك بدون تخزين اي كميات

### Mid-page CTA band
**Title:** ابدأ بدون رأس مال
**Body:** نطبع منتجاتك فقط عند استلام الطلب، مما يتيح لك بدء مشروعك بدون الحاجة لشراء كميات مسبقة أو تخزين بضائع. وفر الوقت والجهد والمال، وركز على بناء علامتك.
**CTA:** جرب الآن مجانًا

### How it works
**Title:** ماهي الطباعة عند الطلب؟
**Sub:** نموذج عمل يتيح لك بيع منتجات مخصصة دون الحاجة لطباعتها أو تخزينها مسبقًا
- **01 اختر منتجاتك** — استعرض قائمة منتجاتنا المتنوعة واختر منها المنتجات التي تود إضافتها إلى متجرك الإلكتروني
- **02 صمّم وجرّب** — قم بإنشاء تصميماتك الإبداعية ورفعها على منصتنا، لترى كيف ستبدو على المنتج بشكل مباشر
- **03 اربط متجرك معنا** — اربط متجرك الإلكتروني مجانًا مع منصة بحر بخطوات بسيطة، وخلي كل شيء يشتغل تلقائياً
- **04 ربط تلقائي ذكي** — أي طلب يجي من عملائك عن طريق متجرك يوصَل مباشرة لنظامنا بدون اي تدخل منك
- **05 الطباعة والشحن** — نطبع المنتج حسب اختيار العميل بجودة عالية، نغلفه باحترافية، ونشحنه مباشرة تحت اسم متجرك

### About page (`/about/`) — full text
**حكاية بدأت بتحدٍ… وتحولت إلى فرصة**
ولدت بحر برنت من تجربة شخصية لمصمم حاول إطلاق علامته التجارية، لكنه اصطدم بتكاليف مرتفعة وتعقيدات لوجستية عطّلت حلمه. بدلًا من التوقف، تحولت التحديات إلى فرصة لبناء حل محلي يفتح الباب لكل المبدعين ورواد الأعمال الراغبين بفتح المتاجر الخاصة فيهم بأقل تكاليف ممكنة.
اليوم، بحر برنت ليست مجرد خدمة طباعة على المنتجات، بل منصة سعودية متكاملة تمكّن المؤثرين، المصممين، وأصحاب الأفكار من تحويل إبداعاتهم إلى منتجات حقيقية تصل إلى عملائهم بسهولة واحترافية.

**رسالتنا** — تمكين أي شخص من إطلاق علامته التجارية بسهولة واحترافية، من خلال خدمات محلية للطباعة عند الطلب تشمل المنتجات، الطباعة، التغليف، والشحن، مع تكامل ذكي.

**رؤيتنا** — أن نصبح الشريك الأول للمبدعين ورواد الأعمال في السعودية والخليج لإطلاق منتجاتهم المطبوعة، وأن نساهم في بناء اقتصاد إبداعي مستدام يعتمد على الحلول التقنية المحلية.

**قيمنا** — قيمنا تقوم على الإبداع الذي يحوّل الأفكار إلى منتجات، والتمكين الذي نمنحه لكل مبدع او رائد أعمال للانطلاق بدون مخاطرة، والجودة التي نلتزم بها في الطباعة والتغليف.

Then "لماذا بحر برنت؟" repeated, then **من ضمن عملائنا** — a row of **The7 stock placeholder logos** (e.g. "treva.") each linking to `https://gray-trout-778524.hostingersite.com/project/project00X/` (a live Hostinger staging domain). No real clients. Then "ابدأ بدون رأس مال" and "ماهي الطباعة عند الطلب؟" repeated.

### Contact page (`/contact/`)
**سجّل اهتمامك الآن وكن من الأوائل!**
نحن في بحر برنت نعمل على إطلاق أول منصة سعودية للطباعة عند الطلب، لتسهيل إطلاق العلامات التجارية بدون رأس مال أو تعقيدات تشغيلية. ورغم أن الإطلاق الرسمي لم يتم بعد، إلا أننا نتيح الفرصة الآن للمهتمين بالتسجيل المبكر ليكونوا من أوائل من يجرب الخدمة ويستفيد منها.
**لماذا تسجل اهتمامك؟**
- أولوية التجربة: ستكون من أول المستخدمين للمنصة فور جاهزيتها.
- خدمة مخصصة مبكرًا: في المرحلة الحالية ننفذ الطلبات يدويًا بالتعاون مع المتاجر المهتمة، مما يمنحك تجربة مباشرة ودعم شخصي.
- مميزات وخصومات حصرية: للمسجلين مبكرًا عروض خاصة عند الإطلاق الرسمي.
- صوتك مسموع: رأيك واقتراحاتك تساعدنا في تطوير المنصة لتناسب احتياجاتك.
التسجيل المبكر يعني أنك شريك في بناء بحر برنت، وليس مجرد مستخدم عادي.

**Fluent Form "Contact - Early Registation"** (sic): الاسم الأول · الاسم الأخير · البريد الإلكتروني · رقم الجوال · هل تصنّف نفسك كـ [مصمم / رسام / مؤثر / رائد أعمال / آخر] · هل تحتاج لمساعدة في التصاميم أم لديك تصاميم جاهزة؟ · هل لديك متجر إلكتروني حالي؟ [نعم / لا / حاليا قيد الإنشاء] · ما المنصة؟ [سلة / زد / WooCommerce / Shopify / أخرى] · رابط المتجر · المنتجات التي تهتم بها (تيشيرت، هودي، بربتوز اطفال، شنط، بروش، كوب، كاب، غلاف جوال) · لماذا انت مهتم؟ · button **إرسال الطلب**. Placeholders are English on an Arabic form.

### FAQ: none.

### Contact bar (above footer): تواصل معنا — contact@b7r.sa — 0501699572

### Footer (navy)
Columns: **تواصل معنا** (contact@b7r.sa, 0501699572) · **القائمة الرئيسية**: من نحن, منتجاتنا, تواصل معنا · **صفحات**: الشروط والأحكام, الشحن والتوصيل, سياسة الخصوصية. White logo, payment/trust badge strip, then: حقوق الطبع والنشر بحر برنت 2025. جميع الحقوق محفوظة ©

### Policy pages (verbatim, for reuse)

**الشروط والأحكام** — باستخدامك منصة بحر برنت، فإنك توافق على الالتزام بهذه الأحكام والشروط، وكل ما يُضاف إليها من تحديثات لاحقًا.
1. التعاريف والطرفان — بحر برنت أو المزود يقصد به المنصة التي تُشغّل خدمة الطباعة عند الطلب. / العميل أو المستخدم يقصد به الشخص الذي يستخدم المنصة. / الطلب يقصد به المنتج الذي يُطلب تنفيذه (الطباعة + التغليف + الشحن). / المنصة يقصد بها الموقع الإلكتروني وواجهة المستخدم ولوحة التحكم والتكامل التقني.
2. التسجيل والاستخدام — المستخدم ملزم بإدخال بيانات صحيحة ومحدثة. / المستخدم يتحمّل مسؤولية صحة التصاميم والملفات التي يرفعها. / لا يجوز استخدام المنصة لأغراض مخالفة للقانون أو انتهاك حقوق الملكية الفكرية. / إذا تبين أن التصميم ينتهك حقوق الغير، يحق لبحر برنت رفض الطلب أو حذفه أو طلب تعديل منه.
3. الطلبات والتنفيذ — الطلب يُنفّذ فقط بعد تأكيد الدفع واستلام الموافقة النهائية (إذا لزم الأمر). / التوقيتات المعلنة للتسليم تُعد تقديرية. / بحر برنت ليست مسؤولة عن التأخير الناتج عن شركة الشحن. / في حالات تلف أو ضرر أثناء الشحن، يجب تقديم شكوى بصور بحلول مهلة (مثلاً داخل 7 أيام من الاستلام).
4. الأسعار والدفع — الأسعار المعروضة تشمل تكلفة المنتج والطباعة، وقد تُضاف رسوم التوصيل حسب المنطقة. / تُحسب كافة الضرائب والرسوم حسب النظام المعمول به في السعودية. / الدفع يتم عبر وسائل دفع إلكترونية معتمدة (مثل مدى، أو بوابات الدفع المحلية). / في حال فشل الدفع أو إلغاء الطلب، يُرجع المبلغ وفق سياسة الإلغاء.
5. حقوق الملكية الفكرية — التصميمات التي يرفعها العميل تبقى ملكه، لكن يعطي بحر برنت ترخيصًا مؤقتًا لاستخدامها لتنفيذ الطلب. / بحر برنت لا تستخدام التصميمات التي يرفعها العميل في التسويق بدون موافقة. / المستخدم يضمن أن التصميمات لا تنتهك حقوق الغير.
6. الإلغاء والاسترجاع — بما أن المنتجات تُصنع حسب الطلب، عادة لا تُقبل الإرجاعات أو التعديلات بعد بدء التنفيذ، إلا في حالات عيب تصنيع أو خطأ من جهتنا. / في حال وجود عيب، يقدم العميل طلبًا في فترة محددة (مثلاً خلال 10 أيام من الاستلام) مع الصور، وسيتم تقييم الطلب (استبدال أو استرداد جزئي). / لا يُسترد مبلغ الشحن ما لم يكن الخطأ من طرف بحر برنت.
7. المسؤولية والتعويض — بحر برنت تبذل أقصى جهد لتوفير الخدمة، لكنها لا تضمن خلوها من الأخطاء. / ليست مسؤولة عن أي ضرر غير مباشر. / المستخدم يتعهد بتعويض بحر برنت عن أي مطالبة قانونية بسبب استخدامه.
8. القانون المعمول به — تخضع هذه الأحكام لقوانين المملكة العربية السعودية، بما يتوافق مع نظام التجارة الإلكترونية. / أي نزاع يُحال إلى المحاكم السعودية المختصة.
9. التعديلات على الأحكام — بحر برنت يحق له تعديل هذه الأحكام في أي وقت، وسيُعلن عن التحديثات على الموقع. / استمرار الاستخدام بعد التعديلات يعني الموافقة.

**الشحن والتوصيل** — في بحر برنت نلتزم بتوصيل منتجاتك لعملائك بسرعة وأمان، مع تجربة احترافية من لحظة الطباعة حتى الاستلام.
1. مناطق الخدمة — داخل السعودية: نوصل الطلبات إلى جميع مدن ومناطق المملكة. / دول الخليج: الخدمة غير متاحة حاليًا، لكنها ستكون متوفرة قريبًا (الإمارات، الكويت، البحرين، عمان، قطر).
2. مدة التوصيل — داخل السعودية: 3 – 5 أيام عمل بعد إتمام الطباعة. / المدة قد تختلف حسب المدينة أو الظروف الاستثنائية. / تبدأ مدة الشحن بعد انتهاء مرحلة الإنتاج (عادة من 1 – 3 أيام عمل).
3. شركات الشحن والتتبع — نتعاون مع شركات شحن محلية موثوقة. / عند شحن الطلب، يحصل العميل على رقم تتبع.
4. تكاليف الشحن — تُحسب تلقائيًا عند إتمام الطلب وتظهر بوضوح قبل الدفع. / أسعار تفضيلية مخفضة بفضل شراكاتنا. / قد تختلف حسب وزن الطلب وموقع العميل.
5. محاولات التوصيل — لكل شحنة 3 محاولات توصيل. / إذا لم يستلم العميل الطلب بعد هذه المحاولات، يتم إلغاء الطلب ولن يتم تعويض قيمته. / العميل مسؤول عن إدخال عنوان صحيح ورقم جوال فعّال.
6. سياسة الإرجاع والتعويض — جميع منتجاتنا يتم تنفيذها حسب الطلب (Print on Demand)، لذلك: 1. لا نقبل الإرجاع أو الاستبدال بعد تنفيذ الطلب. 2. التعويض أو إعادة الطباعة يتم فقط إذا كان الخطأ من طرفنا. / في حالة وجود خطأ من عندنا: نعيد شحن طلب جديد مجانًا، أو نرجع المبلغ المدفوع حسب الحالة. / يجب رفع الشكوى خلال 10 أيام عمل من استلام الطلب، مع صور.

**سياسة الخصوصية** — نلتزم في بحر برنت بحماية خصوصيتك وضمان أمن بياناتك الشخصية. هذه السياسة توضح كيف نجمع، نستخدم، نحتفظ، ونشارك بياناتك.
1. التعاريف والمجال — البيانات الشخصية: أي معلومات تُمكّن من التعرف عليك كفرد. / المنصة / الخدمة: الموقع الإلكتروني، لوحة التحكم، التطبيقات. / تنطبق على مستخدمي المنصة من داخل وخارج المملكة، مع مراعاة القانون السعودي لحماية البيانات.
2. البيانات التي نجمعها — التي تقدمها بنفسك: الاسم، البريد، رقم الجوال، اسم المتجر، التصميمات. / البيانات التلقائية: IP، نوع المتصفح، نظام التشغيل، الصفحات، تاريخ ووقت الدخول، Logs. / ملفات تعريف الارتباط وتقنيات التتبع.
3. استخدام البيانات — تقديم الخدمة وتنفيذ الطلبات. / التواصل بخصوص الطلبات والدعم. / تحسين المنصة وتحليل البيانات. / إرسال عروض تسويقية بشرط موافقتك.
4. مشاركة البيانات — مع مقدمي خدمات مثل شركات الشحن أو الدفع. / لا نبيع بياناتك لأطراف خارجية ابدًا.
5. احتفاظ البيانات — فقط للمدة التي نحتاجها أو وفقاً للمتطلبات القانونية.
6. أمان البيانات — إجراءات تقنية وإدارية. / لن نكشف بياناتك إلا لمن يحق له قانونيًا. / في حال حدوث خرق أمني، سنبلغك حسب متطلبات القانون.
7. حقوقك كمستخدم — الوصول إلى بياناتك. / طلب التصحيح. / طلب الحذف.
8. تغييرات في السياسة — يحق لنا تعديل هذه السياسة في أي وقت. / سنعلن التحديثات على الموقع.

## 3. Contact & trust info

- **Email:** contact@b7r.sa (mailto link, every page)
- **Phone:** 0501699572 (plain text, not `tel:`); JSON-LD gives `+966501699572`
- **WhatsApp:** none — no wa.me link anywhere
- **Social:** only in JSON-LD `sameAs`, not visible: X `https://x.com/B7rPrint`, Instagram `https://www.instagram.com/b7rprint`, TikTok `https://www.tiktok.com/@b7rprint`. No Snapchat, LinkedIn, YouTube.
- **Commercial registration number:** none shown. **Maroof:** none. **VAT number:** none.
- **Trust/payment strip:** one flat PNG in the footer (`/wp-content/uploads/2022/06/footer-copy.png`, empty alt, no links) showing: **mada, VISA, Mastercard, Apple Pay, المركز السعودي للأعمال, وزارة التجارة**.
- **Offers:** "جرب الآن مجانًا" (→ early-registration form); "اربط متجرك الإلكتروني مجانًا"; "مميزات وخصومات حصرية للمسجلين مبكرًا". No free credit amount, **no prices anywhere**.
- **Schema opening hours:** Mon–Sun 09:00–17:00 (unreviewed default).
- Physical address: none.

## 4. Products listed

No prices, sizes, colours or print areas. Home shows 8 cards; `/showcase/` shows 7 (غلاف جوال missing).

| Product | Description (verbatim) | Image |
|---|---|---|
| تيشيرت | قميص نص كم مصنوع من 100% قطن | shirt2.jpg (black tee, "Jeddah KSA" design, hanger) |
| هودي | سترة بغطاء رأس وأكمام طويلة | hodi3.jpg |
| بربتوز | لباس قطعة واحدة للأطفال حتى 12 شهر | baby4.jpg |
| شنطة قماشية | حقيبة مصنوعة من قماش خفيف وجودة عالية | totebag2-1.jpg |
| بروش معدني | قطعة معدنية صغيرة للتثبيت على الملابس | pin.jpg |
| كوب | كوب خزفي للمشروبات، بسعة 350 مل | mug3.jpg |
| كاب | قبعة قطن 100% ذات واجهة منحنية | cap2.jpg |
| غلاف جوال | غلاف بلاستيكي لحماية الجوال (ايفون فقط) | ph4.jpg (home only) |

## 5. SEO snapshot

- **Rendering:** fully server-rendered WordPress HTML (153 KB) — not an SPA.
- `<html dir="rtl" lang="ar">`, `og:locale` = **`ar_AR`** (invalid; should be `ar_SA`).
- **Title (home):** بحر برنت | B7R Print - منصة الطباعة عند الطلب في السعودية
- **Meta description (home):** بحر برنت هو منصة وخدمة طباعة عند الطلب محلية في السعودية، تمكّن الأفراد والشركات من تحويل أفكارهم الإبداعية إلى منتجات مطبوعة احترافية بسهولة، وبدون رأس مال.
- **OG/Twitter:** og:image = the 1390×1390 app icon on every page — no real share image; `og:site_name` has a trailing dash; twitter:site @B7rPrint.
- **Canonical:** self-referencing. **hreflang:** none. Demo pages NOT noindexed.
- **JSON-LD (AIOSEO):** BreadcrumbList, LocalBusiness (telephone, opening hours, image uses `http://`), Organization (logo, sameAs X/Instagram/TikTok), WebPage, WebSite. No Product, FAQPage, or HowTo.
- **robots.txt:** present; `news-sitemap.xml` and `video-sitemap.xml` return 404/empty.
- **sitemap.xml:** ≈52 URLs, ~45 theme demo junk.
- **llms.txt:** 404.
- **Google:** site-verification meta; GA4 `G-JPB02M7C49`; Site Kit.
- **Headings:** **no `<h1>` on any page**; home starts at h3; "01/02" are h2 while "03–05" are h4.
- **Per-page meta:** auto-generated dumps cut mid-sentence; English titles.
- **Other issues:** viewport `maximum-scale=1, user-scalable=0` (blocks zoom); 34 `<script src>` + 49 stylesheets + 4 Google Fonts CSS requests (Alexandria, IBM Plex Sans Arabic, Tajawal, unused Latin bundle); Elementor global colours left at placeholder `#FF0000`; images with empty alt; staging domain live and linked; copyright hardcoded "2025"; Terms contain drafting placeholders "(مثلاً داخل 7 أيام…)" and conflict with Shipping's "10 أيام عمل"; typos "لا تستخدام", "Registation", "نص كم", "ماهي".

## 6. Design observations

**Brand assets:** logo = two-tone blue wave-globe mark + wordmark; white version; an unused 2025 Arabic-only variant; app icon = blue gradient circle with white "7"/wave.

**Palette (Elementor kit):** brand blue `#1091EF`, hover `#0363AA`, navy `#0A2540` (footer, dark sections, mobile menu), orange accent `#FF7F22` / `#D8630E`, title `#222222`, body `#545559`, muted `#b4b5bb`, light box bg `#f4f4f4`, blue overlay `#077FD6C2`, page-transition peach `#FFBC7D`.

**Typography:** headings **Alexandria** (600–700; h1 46px, h2 30px, h3 24px); body **IBM Plex Sans Arabic** 16px/1.7; buttons **Poppins** 500 (Latin font on an Arabic site); **Tajawal** loaded but unused.

**Components:** pill buttons (100px radius; md 38px, lg 54px), flat blue with white text; inputs 48px, 2px light border; container max 1300px; header white with blue CTA; mobile menu navy full-screen.

**Home layout:** header → hero (h3 + paragraph + CTA beside stock image) → "لماذا بحر برنت؟" 4 icon boxes → 8 product cards → navy/blue CTA band → 5 numbered steps → contact bar → navy footer. All CTAs point to `/contact/`; **no link to b7r.app anywhere**.

**Worth keeping:** blue + navy + orange-accent palette; pill CTA; the value-prop, 5-step, mission/vision/values and policy copy as a base; the 2025/09 product mockup photos; the trust strip content (rebuild as real SVG/links with CR number); Organization schema data.

**Discard:** The7/Elementor stack; stock "your logo here" hero; fake client logos + staging links; demo pages/posts; English page titles and form placeholders; Poppins/Tajawal; red placeholder globals; search popup; pre-launch "الإطلاق الرسمي لم يتم بعد" contact copy; hardcoded 2025; no-h1 heading structure; zoom-blocking viewport.
