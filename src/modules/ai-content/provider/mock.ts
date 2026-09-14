import type { FactsSheet } from '@/modules/ai-content/facts';
import { draftForEn, outlineForEn, seoForEn } from '@/modules/ai-content/provider/mock-en';
import type {
  ObjectRequest,
  ObjectResult,
  Provider,
  TextRequest,
  TextResult,
} from '@/modules/ai-content/provider/types';

/**
 * The mock provider (ADR-042): deterministic fixtures built from the topic and the facts
 * sheet, in the language the prompt's `LANGUAGE:` line names (ADR-043; the English ones in
 * `mock-en.ts`), so the pipeline is tested end to end without a network and every generated
 * post differs. Allowed only when `AI_CONTENT_MOCK=1` (tests, CI, the review server); the
 * production assert refuses the flag. Records every call so a test can assert the order and
 * the prompts.
 */
export interface MockCall {
  step: string;
  kind: 'text' | 'object';
  prompt: string;
}

export interface MockOptions {
  facts: FactsSheet;
  /** Rubric total the review returns; below the threshold triggers the revision pass. */
  reviewScore?: number;
  /** The review score after a revision pass. */
  revisedScore?: number;
}

const USAGE = { inputTokens: 1200, outputTokens: 900 };

/** The language the brief names; Arabic unless the line says `en`. */
function english(prompt: string): boolean {
  return /^LANGUAGE:\s*en$/m.test(prompt);
}

/** The topic title the prompt carries (the brief puts it on a `TOPIC:` line). */
function topicOf(prompt: string): string {
  return /^TOPIC:\s*(.+)$/m.exec(prompt)?.[1]?.trim() ?? 'موضوع المقال';
}

function keywordOf(prompt: string): string {
  return /^KEYWORD:\s*(.+)$/m.exec(prompt)?.[1]?.trim() ?? 'الطباعة عند الطلب';
}

function hubOf(prompt: string): string {
  return /^HUB:\s*(.+)$/m.exec(prompt)?.[1]?.trim() ?? 'البداية';
}

/** A small, stable hash so two topics get different but repeatable variants. */
function seed(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) % 1_000_003;
  return h;
}

interface Outline {
  headings: Array<{ question: string; answer: string }>;
  takeaways: string[];
  imageKeyword: string;
}

function outlineFor(topic: string, keyword: string, hub: string): Outline {
  return {
    headings: [
      {
        question: `ما المقصود بـ${keyword}؟`,
        answer: `${keyword} طريقة لبيع منتجات مطبوعة بلا مخزون.`,
      },
      {
        question: 'كيف تبدأ خلال أسبوع واحد؟',
        answer: 'تصميم واحد، متجر، وحساب مجاني تكفي للبداية.',
      },
      {
        question: 'كم تكسب من القطعة الواحدة؟',
        answer: 'الفرق بين سعر البيع والتكلفة الأساسية هو ربحك.',
      },
      {
        question: 'ما الأخطاء التي تبطئ البداية؟',
        answer: 'انتظار التصميم المثالي وتسعير القطعة بلا حساب.',
      },
      {
        question: 'ماذا تفعل بعد أول طلب؟',
        answer: 'راقب ما باع، ووسّع التصميم الناجح إلى منتج ثانٍ.',
      },
    ],
    takeaways: [
      `${keyword}: تبيع أولاً ثم تُطبع القطعة، فلا تدفع إلا تكلفة ما بيع.`,
      `قسم ${hub} يبدأ من تصميم واحد ومتجر على سلة أو زد أو شوبيفاي.`,
      `ربحك هو الفرق بين سعر البيع والتكلفة الأساسية قبل الشحن والضريبة.`,
    ],
    imageKeyword: seed(topic) % 2 === 0 ? 'printed t-shirt studio' : 'small business owner laptop',
  };
}

const joinSentences = (...sentences: string[]) => sentences.join(' ');

function draftFor(prompt: string, facts: FactsSheet): string {
  const topic = topicOf(prompt);
  const keyword = keywordOf(prompt);
  const hub = hubOf(prompt);
  const outline = outlineFor(topic, keyword, hub);
  const sar = (label: RegExp) => facts.numbers.find((n) => n.unit === 'sar' && label.test(n.label));
  const cost = sar(/^تكلفة/)?.value ?? 45;
  const price = sar(/^السعر المقترح/)?.value ?? 89;
  const profit = price - cost;
  const days = facts.numbers.find((n) => n.unit === 'days')?.value ?? 5;
  const credit = facts.numbers.find((n) => n.label === 'الرصيد الترحيبي')?.value ?? 30;
  const count = facts.numbers.find((n) => n.unit === 'count')?.value ?? 5;
  const product = facts.links.find((l) => l.startsWith('/products/')) ?? '/products';
  const variant = seed(topic) % 3;
  const para = joinSentences;
  const openers = [
    `${topic}: سؤال يصل إلينا كل أسبوع من تجار يريدون البداية من دون مصنع ولا مخزون.`,
    `كثير من التجار يؤجلون ${keyword} لأنهم يظنون أن البداية تحتاج رأس مال كبير، والواقع أبسط.`,
    `هذا الدليل يشرح ${keyword} بالأرقام الحقيقية التي يعمل بها التجار في السعودية اليوم.`,
  ];
  const sections = outline.headings.map((h, i) => {
    const body: string[] = [];
    body.push(`## ${h.question}`);
    body.push(h.answer);
    switch (i) {
      case 0:
        body.push(
          para(
            'البداية الصحيحة تفهم النموذج قبل أن تفتح المتجر، لأن كل قرار بعد ذلك، من التصميم إلى السعر، يُبنى عليه.',
            'في الطباعة التقليدية تدفع مقدماً لكمية كاملة ثم تحاول بيعها، وفي الطباعة عند الطلب لا تُطبع أي قطعة إلا بعد أن يشتريها عميلك.',
            `الطلب يصل إلى بحر برنت تلقائياً من متجرك، فتُطبع القطعة في جدة وتُشحن باسم متجرك خلال ${days} أيام كحد أقصى.`,
            'لا حد أدنى للطلب ولا قطع راكدة في نهاية الموسم، وهذا ما يجعل النموذج مناسباً للبداية الصغيرة.',
          ),
        );
        body.push(
          para(
            `الحساب مجاني، وتحصل عند التسجيل على ${credit} ريالاً رصيداً ترحيبياً تجرّب به أول منتج.`,
            `الكتالوج يضم ${count} منتجات بمنطقة طباعة أمامية واحدة، فتركز على التصميم لا على اللوجستيات.`,
            'ما يتغير عندك هو طريقة التفكير: بدل أن تسأل كم قطعة أشتري، تسأل أي تصميم يبيع، وتترك الطباعة والشحن لمن يعملها كل يوم.',
          ),
        );
        body.push(
          para(
            'التاجر الذي يبدأ بهذه الطريقة يخسر أقل عندما يخطئ، لأنه لم يدفع ثمن مخزون لم يُبع، ويربح أسرع عندما يصيب، لأن التوسع لا يحتاج إلا تصميماً جديداً.',
            'وهذا ما يجعل النموذج مناسباً للمصمم في بداية طريقه، ولصاحب المتجر الذي يريد خطاً جديداً بلا مخاطرة.',
          ),
        );
        break;
      case 1:
        body.push(
          para(
            'الخطوة الأولى اسم لبراندك يسهل نطقه وكتابته، والثانية تصميم واحد بجودة مناسبة للطباعة، والثالثة متجر إلكتروني.',
            'إن كان متجرك على سلة أو زد أو شوبيفاي فالربط يستغرق دقائق، وبعده تنشر المنتج وتبدأ البيع في اليوم نفسه.',
          ),
        );
        body.push('- اختر تصميماً واحداً واختبره قبل أن تصمم مجموعة كاملة.');
        body.push('- حدد سعر البيع من حاسبة الربح قبل أن تنشر المنتج.');
        body.push(`- اقرأ [كيف تعمل الخدمة](/how-it-works) مرة واحدة، ثم ابدأ.`);
        body.push(
          para(
            'لا تنتظر التصميم المثالي، فالبراندات التي تنجح تبدأ من قطعة واحدة وتعدّل بعد أول عشرة طلبات.',
            'اجعل صفحة المنتج واضحة: صورة حقيقية للقطعة، والمقاسات، ووقت التوصيل.',
            'واكتب في الوصف لمن هذا التصميم ولماذا، بجملتين، فالعميل يشتري القصة قبل القماش.',
          ),
        );
        body.push(
          para(
            'في اليوم الأول انشر المنتج وشاركه مع عشرة أشخاص تعرفهم، ثم اقرأ أسئلتهم قبل أن تقرأ مبيعاتهم.',
            'الأسئلة المتكررة تخبرك بما ينقص صفحة المنتج، والصمت يخبرك بأن التصميم لم يلمس أحداً بعد.',
            'بعد أسبوع تكون عندك بيانات حقيقية بدل التخمين، وهذا أثمن من أي دورة تسويق.',
          ),
        );
        break;
      case 2:
        body.push(
          para(
            `مثال من الكتالوج: [التيشيرت الأساسي](${product}) تكلفته ${cost} ريالاً وسعر البيع المقترح ${price} ريالاً.`,
            `الفرق ${profit} ريالاً هو ربحك التقديري لكل قطعة قبل الشحن والضريبة، وهو يُخصم من محفظتك ويُضاف إليها مع كل طلب.`,
            'ارفع الهامش عندما يكون تصميمك مميزاً أو جمهورك مخلصاً، واخفضه عندما تختبر سوقاً جديدة.',
          ),
        );
        body.push(
          para(
            'اكتب الأرقام الثلاثة قبل أن تنشر: التكلفة، وسعر البيع، والربح لكل قطعة.',
            'التاجر الذي يعرف أرقامه لا يخاف من الخصومات الموسمية لأنه يعرف أين يقف هامشه.',
            'ولا يخاف من منافس يبيع بأقل، لأنه يعرف أن السعر الأقل من التكلفة لا يستمر طويلاً.',
          ),
        );
        body.push(
          para(
            'الشحن والضريبة يأتيان بعد هذا الحساب لا قبله: الشحن داخل المملكة يُخصم من المحفظة مع كل طلب، والضريبة تُحسب حسب وضع متجرك.',
            'إن كنت تعرض شحناً مجانياً، فضمّن تكلفته في السعر بدل أن تكتشف في نهاية الشهر أن الهامش ذاب.',
            'وإن كنت تبيع قطعة واحدة في الطلب غالباً، فسعر أعلى بقليل مع شحن مضمّن يقنع العميل أكثر من سعر منخفض تُضاف إليه رسوم في آخر خطوة.',
          ),
        );
        break;
      case 3:
        body.push(
          para(
            'الخطأ الأول انتظار التصميم المثالي، والثاني تسعير القطعة بأقل من السوق ظناً أن السعر وحده يبيع.',
            'الخطأ الثالث نسخ تصاميم محمية بحقوق، وهو ما يعرّض متجرك للإغلاق قبل أن يبدأ.',
            'الخطأ الرابع إهمال صفحة المنتج: صورة واحدة ضعيفة تخسر طلبات أكثر مما يخسرها السعر.',
          ),
        );
        body.push(
          para(
            'راجع [الأسئلة الشائعة](/faq) قبل أن تفتح تذكرة دعم، فمعظم ما يوقف التاجر الجديد مكتوب فيها.',
            variant === 0
              ? 'وإن كان عندك سؤال لا تجد جوابه، فالتواصل عبر واتساب أسرع طريق.'
              : 'وعندما تتردد في قرار، ارجع إلى أرقامك لا إلى حدسك.',
          ),
        );
        body.push(
          para(
            'الخطأ الخامس أن تفتح خمسة منتجات في يوم واحد وتوزع جهدك عليها، فلا يحصل أي منها على صورة جيدة ولا وصف مقنع.',
            'ابدأ بمنتج واحد وتصميم واحد، واجعلهما يستحقان الطلب، ثم كرر ما نجح.',
            'كل خطأ من هذه يمكن إصلاحه في أسبوع، بشرط أن تقرأ أرقام متجرك كل يوم.',
          ),
        );
        break;
      default:
        body.push(
          para(
            'بعد أول طلب راقب ثلاثة أشياء: أي تصميم باع، ومن أي مدينة جاء الطلب، وكم استغرق العميل قبل الشراء.',
            'وسّع التصميم الناجح إلى منتج ثانٍ من الكتالوج نفسه دون تكلفة إضافية، فالتصميم واحد والقطعة تختلف.',
            `اختبر السعر أسبوعين قبل أن تغيّره، فالخصومات الدائمة تعلّم عميلك الانتظار.`,
          ),
        );
        body.push(
          para(
            'القاعدة واحدة في كل موسم: ابدأ صغيراً، وقس النتائج، ثم وسّع ما ينجح.',
            `هذا هو جوهر ${keyword}، وهو ما يجعل البداية ممكنة اليوم لا بعد سنة.`,
            'المواسم تأتي كل عام بمواعيدها المعروفة، فجهّز تصاميم الموسم القادم قبله بستة أسابيع، وراقب أي تصميم من الموسم الماضي ما زال يبيع.',
          ),
        );
        body.push(
          para(
            'وفي النهاية تذكّر أن المتجر الناجح ليس الذي يملك أكثر التصاميم، بل الذي يعرف عملاءه أكثر: من أي مدينة يشترون، وما المقاس الأكثر طلباً، ومتى يعودون.',
            'هذه المعرفة تُبنى طلباً بعد طلب، وتبدأ من أول قطعة تنشرها هذا الأسبوع.',
          ),
        );
    }
    return body.join('\n\n');
  });
  return [openers[variant]!, ...sections].join('\n\n');
}

function seoFor(prompt: string): { title: string; description: string; slug: string; alt: string } {
  const topic = topicOf(prompt);
  const keyword = keywordOf(prompt);
  return {
    title: topic.length <= 60 ? topic : topic.slice(0, 57).trimEnd(),
    description:
      `دليل عملي عن ${keyword} في السعودية بالأرقام الحقيقية: التكلفة، الربح، والخطوات.`.slice(
        0,
        155,
      ),
    slug: `${keyword.replace(/\s+/g, '-').slice(0, 20)}-guide`,
    alt: `تيشيرت مطبوع بتصميم عربي على طاولة عمل`,
  };
}

export function mockProvider(options: MockOptions): Provider & { calls: MockCall[] } {
  const calls: MockCall[] = [];
  const reviewScore = options.reviewScore ?? 90;
  const revisedScore = options.revisedScore ?? 92;
  return {
    name: 'mock',
    model: 'mock-1',
    calls,
    async text(req: TextRequest): Promise<TextResult> {
      calls.push({ step: req.step, kind: 'text', prompt: req.prompt });
      const en = english(req.prompt);
      if (req.step === 'draft' || req.step === 'revise') {
        const text = en
          ? draftForEn(topicOf(req.prompt), keywordOf(req.prompt), hubOf(req.prompt), options.facts)
          : draftFor(req.prompt, options.facts);
        return { text, usage: USAGE };
      }
      if (req.step === 'alt') {
        const alt = en
          ? seoForEn(topicOf(req.prompt), keywordOf(req.prompt)).alt
          : seoFor(req.prompt).alt;
        return { text: alt, usage: USAGE };
      }
      return { text: '', usage: USAGE };
    },
    async object<T>(req: ObjectRequest<T>): Promise<ObjectResult<T>> {
      calls.push({ step: req.step, kind: 'object', prompt: req.prompt });
      let value: unknown;
      const en = english(req.prompt);
      if (req.step === 'outline') {
        value = (en ? outlineForEn : outlineFor)(
          topicOf(req.prompt),
          keywordOf(req.prompt),
          hubOf(req.prompt),
        );
      } else if (req.step === 'review') {
        const revised = /REVISION PASS/.test(req.prompt);
        const total = revised ? revisedScore : reviewScore;
        value = {
          facts: Math.round(total * 0.3),
          language: Math.round(total * 0.25),
          structure: Math.round(total * 0.2),
          usefulness: Math.round(total * 0.15),
          formatting:
            total -
            Math.round(total * 0.3) -
            Math.round(total * 0.25) -
            Math.round(total * 0.2) -
            Math.round(total * 0.15),
          critique: en
            ? revised
              ? 'The second draft is clearer and closer to the numbers.'
              : 'Move the numeric example closer to the start of the article.'
            : revised
              ? 'المسودة الثانية أوضح وأقرب إلى الأرقام.'
              : 'اجعل المثال الرقمي أقرب إلى بداية المقال.',
        };
      } else if (req.step === 'seo') {
        value = en ? seoForEn(topicOf(req.prompt), keywordOf(req.prompt)) : seoFor(req.prompt);
      } else {
        throw new Error(`mock provider: no fixture for step ${req.step}`);
      }
      return { value: req.schema.parse(value), usage: USAGE };
    },
  };
}
