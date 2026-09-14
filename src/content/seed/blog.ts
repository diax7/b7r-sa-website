import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BlogAuthor, BlogHub, BlogPost } from '@/content/schema';

/**
 * The blog seed (BRD 10.1, Appendix E; ADR-041): the six hubs, the author and the three
 * Level 1 posts, created once by `pnpm content:migrate`. Hub names, post titles and the
 * author line are the BRD's; hub descriptions and leads, the author's bio, the excerpts,
 * takeaways and bodies are agent-written under BRD 4.1 and listed for Dhia's review
 * (Appendix G). The posts were machine-written (ADR-018), so they seed as `origin: ai`.
 */
export const blogHubs: BlogHub[] = [
  {
    slug: 'getting-started',
    name: 'البداية',
    // TODO(copy): hub descriptions and leads are Level 3 copy for Dhia (Appendix G)
    description: 'أول خطوة نحو براندك: الفكرة، والتصميم الأول، والمتجر، من دون مصنع ولا مخزون.',
    lead: 'كل ما تحتاجه لتبدأ من الصفر.',
    cover: '/images/lifestyle/cover-start-brand.jpg',
  },
  {
    slug: 'pod-basics',
    name: 'أساسيات الطباعة عند الطلب',
    description:
      'كيف تعمل الطباعة عند الطلب في السعودية، وما الفرق بينها وبين الدروبشيبينغ، وأي تقنية تناسب تصميمك.',
    lead: 'افهم النموذج قبل أن تبيع أول قطعة.',
    cover: '/images/lifestyle/cover-print-on-demand.jpg',
  },
  {
    slug: 'salla-zid-shopify',
    name: 'سلة وزد وشوبيفاي',
    description: 'ربط متجرك بالطباعة عند الطلب، وإعداد المنتجات والمقاسات، والتطبيقات التي تساعدك.',
    lead: 'متجرك يعمل وحده بعد الربط.',
    cover: '/images/lifestyle/hanging-tshirt-mockup.jpg',
  },
  {
    slug: 'design',
    name: 'التصميم',
    description:
      'مقاسات ملفات الطباعة، والخط العربي، والأفكار التي تبيع في السعودية، وحقوق الملكية.',
    lead: 'تصاميم تُطبع صح وتبيع أكثر.',
    cover: '/images/lifestyle/cover-start-brand.jpg',
  },
  {
    slug: 'pricing-profit',
    name: 'التسعير والربح',
    description: 'كيف تسعّر منتجاتك المطبوعة، وتحسب هامش ربحك، وتتعامل مع الشحن والضريبة.',
    lead: 'أرقام واضحة قبل أول طلب.',
    cover: '/images/lifestyle/cover-pricing.jpg',
  },
  {
    slug: 'seasons',
    name: 'المواسم',
    description: 'اليوم الوطني ويوم التأسيس ورمضان والعودة للمدارس: متى تجهّز متجرك وماذا تبيع.',
    lead: 'جهّز متجرك قبل الموسم بأسابيع.',
    cover: '/images/lifestyle/cover-print-on-demand.jpg',
  },
];

export const blogAuthor: BlogAuthor = {
  slug: 'dhia',
  name: 'ضياء',
  role: 'مؤسس بحر برنت',
  // TODO(copy): author bio is Level 3 copy for Dhia (Appendix G)
  bio: 'مؤسس بحر برنت. يكتب عن الطباعة عند الطلب وبناء البراندات في السعودية من تجربة يومية مع التجار.',
};

/** The body of a seeded post: Markdown, converted to Lexical by the seed. */
export function blogPostBody(slug: string): string {
  return readFileSync(join(process.cwd(), 'src', 'content', 'seed', 'blog', `${slug}.md`), 'utf8');
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'start-clothing-brand-saudi-no-factory-no-stock',
    title: 'كيف تبدأ براند ملابس في السعودية بدون مصنع وبدون مخزون',
    hub: 'getting-started',
    sample: true,
    excerpt: 'ثلاثة أشياء تكفي للبداية: اسم، تصميم واحد، ومتجر. الباقي يحدث بعد أول طلب.',
    cover: '/images/lifestyle/cover-start-brand.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'تبيع القطعة قبل أن تُطبع، فلا تدفع إلا تكلفة ما بيع فعلاً.',
      'تحتاج اسماً وتصميماً واحداً ومتجراً على سلة أو زد أو شوبيفاي.',
      'التيشيرت الأساسي أفضل بداية: تكلفة 45 ريالاً وسعر مقترح 89 ريالاً.',
    ],
    author: 'ضياء',
  },
  {
    slug: 'what-is-print-on-demand-saudi-examples',
    title: 'ما هي الطباعة عند الطلب؟ شرح مبسط بالأمثلة السعودية',
    hub: 'pod-basics',
    sample: true,
    excerpt: 'لا تُطبع القطعة إلا بعد أن يشتريها عميلك. مثال كامل من الطلب إلى الشحن.',
    cover: '/images/lifestyle/cover-print-on-demand.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'لا مخزون ولا حد أدنى: تدفع تكلفة قطعة واحدة عند كل عملية بيع.',
      'الطلب يصل تلقائياً من متجرك، ونطبعه في جدة ونشحنه باسمك خلال 5 أيام.',
      'خمسة منتجات بمنطقة طباعة أمامية 28 × 38 سم.',
    ],
    author: 'ضياء',
  },
  {
    slug: 'how-to-price-printed-tshirt-saudi',
    title: 'كيف تسعّر تيشيرت مطبوع في السعودية؟',
    hub: 'pricing-profit',
    sample: true,
    excerpt: 'ابدأ من التكلفة الأساسية، أضف الشحن والضريبة، ثم حدد هامشاً يستحق الجهد.',
    cover: '/images/lifestyle/cover-pricing.jpg',
    publishedAt: '2026-09-13',
    updatedAt: '2026-09-13',
    takeaways: [
      'التكلفة الأساسية تشمل المنتج والطباعة والتغليف، لا الشحن والضريبة.',
      'السعر المقترح للتيشيرت الأساسي 89 ريالاً، أي ربح تقديري 44 ريالاً للقطعة.',
      'اختبر السعر أسبوعين قبل أن تغيّره، والخصومات الدائمة تعلّم عميلك الانتظار.',
    ],
    author: 'ضياء',
  },
];
