import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@/content/schema';
import { seo } from '@/content/seed/seo';

/**
 * The seven designed pages (BRD 4.9–4.12, Appendix B) as `pages` documents: the seed for the
 * collection (ADR-026, ADR-031) and the verbatim source the copy test checks. Media are site
 * paths here; the seed uploads them. SEO rows come from BRD 4.16 (they leave `seo-defaults`).
 */

const legal = (slug: 'terms' | 'shipping' | 'privacy') =>
  readFileSync(join(process.cwd(), 'src', 'content', 'seed', 'legal', `${slug}.md`), 'utf8');

/** The page's BRD 4.16 row: title, description and the OG image when it has one. */
function seoFor(slug: string): Page['seo'] {
  const row = seo.find((r) => r.route === `/${slug}`);
  if (!row) throw new Error(`seed pages: no BRD 4.16 row for /${slug}`);
  return {
    title: row.title,
    description: row.description,
    ...(row.ogImage ? { ogImage: row.ogImage } : {}),
  };
}

const ICONS_3D = '/images/icons-3d';

export const howItWorks: Page = {
  slug: 'how-it-works',
  title: 'كيف تعمل الطباعة عند الطلب مع بحر؟',
  lead: 'نموذج عمل يتيح لك بيع منتجات مخصصة دون أن تطبعها أو تخزنها.',
  blocks: [
    {
      id: 'steps-1',
      blockType: 'steps',
      items: [
        {
          order: 1,
          title: 'أنشئ حسابك مجاناً',
          text: 'سجّل خلال دقيقة واحصل على 30 ريالاً رصيداً ترحيبياً.',
          icon: `${ICONS_3D}/tee-plus-create-product.jpg`,
        },
        {
          order: 2,
          title: 'اختر منتجك وصمّمه',
          text: 'ارفع تصميمك وشاهده على المنتج مباشرة، وحدّد سعر البيع.',
          icon: `${ICONS_3D}/laptop-link-connect-store.jpg`,
        },
        {
          order: 3,
          title: 'اربط متجرك',
          text: 'سلة أو زد أو شوبيفاي، بربط آمن وبدون مشاركة أي بيانات حساسة.',
          icon: `${ICONS_3D}/bag-and-parcel-order.jpg`,
        },
        {
          order: 4,
          title: 'انشر المنتج بضغطة',
          text: 'يُزامَن الاسم والصور والخيارات والسعر إلى متجرك تلقائياً.',
          icon: `${ICONS_3D}/printer-print.jpg`,
        },
        {
          order: 5,
          title: 'نطبع ونغلّف ونشحن',
          text: 'كل طلب يصلنا فور شرائه، نخصم التكلفة من محفظتك، ونشحنه باسم متجرك خلال 5 أيام كحد أقصى.',
          icon: `${ICONS_3D}/truck-delivery.jpg`,
        },
      ],
    },
    {
      id: 'profitEquation-2',
      blockType: 'profitEquation',
      title: 'كيف تُحسب أرباحك؟',
      sell: 'سعر البيع',
      base: 'التكلفة الأساسية',
      profit: 'ربحك',
      exampleLine: 'مثال: تيشيرت تبيعه بـ 89 وتكلفته 45، ربحك 44 لكل قطعة.',
    },
    // Mini FAQ: home items 2, 3, 4 (BRD 4.9), under the home FAQ title with the link.
    {
      id: 'faqList-3',
      blockType: 'faqList',
      selection: 'home',
      offset: 1,
      limit: 3,
      title: 'الأسئلة الشائعة',
      link: { label: 'كل الأسئلة', href: '/faq' },
    },
  ],
  seo: seoFor('how-it-works'),
  updatedAt: '2026-09-12',
};

export const about: Page = {
  slug: 'about',
  title: 'من نحن',
  blocks: [
    {
      id: 'story-4',
      blockType: 'story',
      heading: 'حكاية بدأت بتحدٍّ وتحوّلت إلى فرصة',
      text: 'وُلدت بحر برنت من تجربة مصمم حاول إطلاق علامته التجارية، فاصطدم بتكاليف مرتفعة وتعقيدات لوجستية عطّلت حلمه. تحوّل التحدي إلى فرصة لبناء حل محلي يفتح الباب لكل مبدع ورائد أعمال ليطلق منتجاته بأقل التكاليف. اليوم، بحر برنت منصة سعودية متكاملة تمكّن المؤثرين والمصممين وأصحاب الأفكار من تحويل إبداعاتهم إلى منتجات حقيقية تصل إلى عملائهم بسهولة واحترافية.',
      line: 'نطبع ونشحن من جدة إلى كل مدن المملكة.',
      photo: { src: '/images/lifestyle/hanging-tshirt-mockup.jpg', alt: '' },
      withFacts: true,
    },
    {
      id: 'cards-5',
      blockType: 'cards',
      items: [
        {
          icon: 'Target',
          title: 'رسالتنا',
          text: 'تمكين أي شخص من إطلاق علامته التجارية بسهولة، عبر خدمة محلية للطباعة عند الطلب تشمل المنتجات والطباعة والتغليف والشحن، مع ربط ذكي بمتجره.',
          art: `${ICONS_3D}/tee-plus-create-product.jpg`,
        },
        {
          icon: 'Eye',
          title: 'رؤيتنا',
          text: 'أن نكون الشريك الأول للمبدعين ورواد الأعمال في السعودية والخليج لإطلاق منتجاتهم المطبوعة، وأن نسهم في اقتصاد إبداعي مستدام يقوم على حلول تقنية محلية.',
          art: `${ICONS_3D}/box-of-products.jpg`,
        },
        {
          icon: 'Heart',
          title: 'قيمنا',
          text: 'الإبداع الذي يحوّل الأفكار إلى منتجات، والتمكين الذي يمنح كل مبدع بداية بلا مخاطرة، والجودة التي نلتزم بها في الطباعة والتغليف.',
          art: `${ICONS_3D}/printer-print.jpg`,
        },
      ],
    },
    {
      id: 'miskCredential-6',
      blockType: 'miskCredential',
      title: 'خريجو برنامج Misk Launchpad',
      text: 'بحر برنت من خريجي الدفعة التاسعة (2026) من برنامج Misk Launchpad، برنامج ما قبل التسريع من مؤسسة محمد بن سلمان «مسك».',
    },
  ],
  seo: seoFor('about'),
  updatedAt: '2026-09-12',
};

export const contact: Page = {
  slug: 'contact',
  title: 'تواصل معنا',
  lead: 'تاجر، شريك، أو مستثمر؟ نرد على الجميع.',
  blocks: [
    {
      id: 'contact-7',
      blockType: 'contact',
      whatsappTitle: 'واتساب',
      whatsappText: 'راسلنا مباشرة',
      emailTitle: 'البريد الإلكتروني',
      phoneTitle: 'الهاتف',
      followTitle: 'تابعنا',
      booking: {
        title: 'احجز استشارة مجانية',
        text: '30 دقيقة نجاوب فيها على أسئلتك ونساعدك تبدأ.',
        button: 'احجز موعدك',
        whatsappMessage: 'مرحباً، أرغب بحجز استشارة مجانية.',
      },
    },
  ],
  seo: seoFor('contact'),
  updatedAt: '2026-09-12',
};

export const faq: Page = {
  slug: 'faq',
  title: 'الأسئلة الشائعة',
  lead: 'كل ما تحتاج معرفته قبل أن تبدأ.',
  blocks: [
    {
      id: 'faqList-8',
      blockType: 'faqList',
      selection: 'all',
      offset: 0,
      bottomLine: 'لم تجد إجابتك؟ راسلنا على واتساب.',
      bottomLinkWord: 'واتساب',
    },
  ],
  seo: seoFor('faq'),
  updatedAt: '2026-09-12',
};

/** Appendix B, verbatim from the Markdown files; the visible date is the body's. */
const legalPage = (slug: 'terms' | 'shipping' | 'privacy', title: string): Page => ({
  slug,
  title,
  blocks: [
    { id: `legal-${slug}`, blockType: 'legalBody', updatedAt: '2026-09-12', body: legal(slug) },
  ],
  seo: seoFor(slug),
  updatedAt: '2026-09-12',
});

export const terms = legalPage('terms', 'الشروط والأحكام');
export const shipping = legalPage('shipping', 'الشحن والتوصيل');
export const privacy = legalPage('privacy', 'سياسة الخصوصية');

/**
 * The comparison page (ADR-050, E7): B7R against Printful for a Saudi merchant, seeded as a
 * draft until Dhia approves the facts. TODO(copy): the Arabic is written under BRD 0.5 and
 * listed for his review; the claims about Printful are its public pages read on 2026-09-16
 * (the help centre's shipping and pricing pages, the integrations directory), named on the
 * page as text, never linked (BRD 7.9). BRD 1.2 states the positioning the rows expand.
 */
export const comparePrintful: Page = {
  slug: 'compare-printful',
  title: 'بحر برنت مقابل Printful: أيهما أنسب لمتجر سعودي؟',
  lead: 'مقارنة بالأرقام لتاجر يبيع في السعودية: من أين تُطبع القطعة، متى تصل، وكم تكلّف.',
  draft: true,
  blocks: [
    {
      id: 'compare-1',
      blockType: 'compare',
      intro:
        'الجدول يقارن ما يهم التاجر السعودي أولاً: مكان الطباعة، مدة التوصيل، الحد الأدنى، السعر بالريال، وربط المتجر. أرقام بحر برنت من الموقع نفسه؛ أرقام Printful من صفحاته العامة بتاريخ القراءة المذكور أسفل الجدول.',
      ours: 'بحر برنت',
      theirs: 'Printful',
      asOf: '2026-09-16',
      rows: [
        {
          criterion: 'أين تُطبع القطعة',
          ours: 'جدة',
          theirs: 'أوروبا أو أمريكا الشمالية، بحسب المنتج',
        },
        {
          criterion: 'مدة التوصيل إلى الرياض أو جدة',
          ours: 'حتى 5 أيام من استلام الطلب، شاملة الطباعة',
          theirs: 'من أسبوعين إلى أربعة أسابيع، شحناً دولياً',
        },
        {
          criterion: 'الرسوم الجمركية على عميلك',
          ours: 'لا شيء: الشحن داخل المملكة',
          theirs: 'قد تُفرض عند الوصول ويدفعها المستلم',
        },
        { criterion: 'الحد الأدنى للطلب', ours: 'قطعة واحدة', theirs: 'قطعة واحدة' },
        {
          criterion: 'تكلفة تيشيرت أساسي مطبوع',
          ours: 'تبدأ من 45 ريالاً، السعر معلن',
          theirs: 'بالدولار، يُضاف إليها الشحن الدولي والضريبة عند الوصول',
        },
        {
          criterion: 'ربط المتجر',
          ours: 'سلة وزد وشوبيفاي بضغطة',
          theirs: 'شوبيفاي ومتاجر عالمية؛ لا تطبيق لسلة أو زد',
        },
        {
          criterion: 'الفاتورة وضريبة القيمة المضافة',
          ours: 'فاتورة سعودية بضريبة القيمة المضافة',
          theirs: 'فاتورة أجنبية بلا ضريبة سعودية',
        },
        { criterion: 'لغة الدعم', ours: 'العربية على واتساب', theirs: 'الإنجليزية' },
      ],
      bestFor: [
        'تاجراً على سلة أو زد تريد أن يصل الطلب لعميلك خلال أيام لا أسابيع',
        'تبدأ براندك بقطعة واحدة بلا مخزون ولا رأس مال',
        'تريد فاتورة سعودية وسعراً بالريال معلناً قبل أن تبيع',
      ],
      notBestFor: [
        'تبيع خارج السعودية أساساً، أو تريد كتالوجاً من مئات المنتجات',
        'تحتاج طلبية كبيرة بمئات القطع بسعر الجملة',
      ],
      closing:
        'الخلاصة: لتاجر يبيع داخل السعودية، بحر برنت يطبع في جدة ويوصّل خلال 5 أيام باسمك وبفاتورة سعودية؛ Printful خيار لمن يبيع للخارج أو يريد كتالوجاً أوسع. جرّب بقطعة واحدة ورصيد ترحيبي 30 ريالاً.',
    },
  ],
  seo: seoFor('compare-printful'),
  updatedAt: '2026-09-16',
};

/** The seven, in the navigation's order, and the comparison (a draft). */
export const pages: Page[] = [
  howItWorks,
  about,
  contact,
  faq,
  terms,
  shipping,
  privacy,
  comparePrintful,
];
