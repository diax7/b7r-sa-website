import { ANSWER_ENGINE_BOTS } from '@/modules/core/seo/robots';
import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import {
  type DocKind,
  docLabel,
  editHref,
  finding,
  has,
  loc,
  prorata,
} from '@/modules/visibility/rules/shared';

/** A service connection that exists, is on and passed its last test: that is "verified". */
function serviceStatus(s: Snapshot, kind: string): 'done' | 'next' | 'missing' {
  const rows = s.connections.filter((c) => c.kind === kind);
  if (rows.length === 0) return 'missing';
  return rows.some((c) => c.enabled && c.lastTestOk === true) ? 'done' : 'next';
}

/** Crawl access (ADR-049 C1 to C5): the engines can reach and index every page. */
export function crawl(s: Snapshot): Finding[] {
  const connections = `${s.adminRoute}/collections/connections`;
  const english = s.englishOn
    ? [
        ...s.pages.map((d) => ({ d, collection: 'pages', kind: 'page' as DocKind })),
        ...s.products.map((d) => ({ d, collection: 'products', kind: 'product' as DocKind })),
        ...s.posts.map((d) => ({ d, collection: 'posts', kind: 'post' as DocKind })),
        ...s.hubs.map((d) => ({ d, collection: 'categories', kind: 'hub' as DocKind })),
        ...s.authors.map((a) => ({
          d: { id: a.id, slug: `author ${a.id}`, title: a.name },
          collection: 'authors',
          kind: 'author' as DocKind,
        })),
      ].map(({ d, collection, kind }) => ({
        ok: has(loc(d.title, 'en')),
        label: docLabel(loc(d.title, 'ar') || d.slug, kind),
        href: editHref(s.adminRoute, collection, d.id, 'en'),
      }))
    : [];
  return [
    finding({
      key: 'C1',
      section: 'crawl',
      status: s.isProductionSite ? 'done' : 'missing',
      title: {
        en: 'The site runs at its production address',
        ar: 'الموقع يعمل على عنوانه النهائي',
      },
      guide: {
        en: 'Only at https://b7r.sa does robots.txt allow everything and every page ask to be indexed; anywhere else (a preview or a review server) every page says noindex, on purpose. Nothing to set in the panel: the address is set where the site is hosted.',
        ar: 'على https://b7r.sa وحده يسمح robots.txt بكل شيء وتطلب كل صفحة فهرستها؛ وفي أي مكان آخر (معاينة أو خادم مراجعة) تقول كل صفحة noindex عمداً. لا شيء يُضبط في اللوحة: العنوان يُضبط حيث يُستضاف الموقع.',
      },
    }),
    finding({
      key: 'C2',
      section: 'crawl',
      status: s.indexNow ? 'done' : 'missing',
      title: {
        en: 'IndexNow is on',
        ar: 'IndexNow يعمل',
      },
      guide: {
        en: 'On the production server every publish is announced within the minute to Bing and to the engines that read IndexNow (ChatGPT Search leans on Bing); a review or preview server never announces. Nothing to set in the panel: it comes on with the production server.',
        ar: 'على خادم الإنتاج يُبلَّغ Bing والمحرّكات التي تقرأ IndexNow بكل نشر خلال دقيقة (ChatGPT Search يعتمد على Bing)؛ وخادم المراجعة أو المعاينة لا يبلّغ أبداً. لا شيء يُضبط في اللوحة: يعمل مع خادم الإنتاج.',
      },
    }),
    finding({
      key: 'C3',
      section: 'crawl',
      status: serviceStatus(s, 'google-search-console'),
      title: {
        en: 'Search Console is connected and its test passed',
        ar: 'Search Console متصل واختباره ناجح',
      },
      guide: {
        en: 'A Search Console connection whose test passed proves Google sees the site; a verification tag alone proves nothing. Add it under Admin, Connections (a service account added as a user of the site in Search Console), then press Test connection.',
        ar: 'اتصال Search Console الذي نجح اختباره يثبت أن Google يرى الموقع؛ ووسم التحقق وحده لا يثبت شيئاً. أضفه في الإدارة، الاتصالات (حساب خدمة مضاف مستخدماً على الموقع في Search Console)، ثم اضغط «اختبر الاتصال».',
      },
      href: connections,
    }),
    finding({
      key: 'C4',
      section: 'crawl',
      status: serviceStatus(s, 'bing-webmaster'),
      title: {
        en: 'Bing Webmaster Tools is connected and its test passed',
        ar: 'Bing Webmaster Tools متصل واختباره ناجح',
      },
      guide: {
        en: 'ChatGPT Search and Copilot read the Bing index. Add a Bing Webmaster connection with its API key under Admin, Connections, then press Test connection.',
        ar: 'ChatGPT Search وCopilot يقرآن فهرس Bing. أضف اتصال Bing Webmaster بمفتاحه في الإدارة، الاتصالات، ثم اضغط «اختبر الاتصال».',
      },
      href: connections,
    }),
    prorata({
      key: 'C5',
      section: 'crawl',
      checks: english,
      title: {
        en: 'Every published document exists in English',
        ar: 'كل مستند منشور له نسخة إنجليزية',
      },
      guide: {
        en: 'While the site is in English, a document without an English title (an author without an English name) has no English page and no language pair for the engines. Open its English version and fill the title, then the rest.',
        ar: 'ما دام الموقع بالإنجليزية، فالمستند بلا عنوان إنجليزي (والكاتب بلا اسم إنجليزي) لا صفحة إنجليزية له ولا زوج لغوي للمحرّكات. افتح نسخته الإنجليزية واملأ العنوان، ثم البقية.',
      },
    }),
  ];
}

export function crawlFacts(s: Snapshot): Fact[] {
  const bots = ANSWER_ENGINE_BOTS.join(', ');
  const botsAr = ANSWER_ENGINE_BOTS.join('، ');
  return [
    {
      section: 'crawl',
      text: {
        en: `robots.txt names the answer-engine bots (${bots}) and allows them; the traffic count sees every one of them read a page.`,
        ar: `robots.txt يسمّي زواحف محرّكات الإجابة (${botsAr}) ويسمح لها؛ وعدّاد الزيارات يرى كل واحدة منها تقرأ صفحة.`,
      },
    },
    {
      section: 'crawl',
      text: {
        en: `sitemap.xml, llms.txt${s.englishOn ? ' and en/llms.txt' : ''} are generated from the content on every publish; every page carries its canonical link and, where the other language exists, the reciprocal hreflang pair with the Arabic as the default.`,
        ar: `sitemap.xml وllms.txt${s.englishOn ? ' وen/llms.txt' : ''} تُولَّد من المحتوى عند كل نشر؛ وكل صفحة تحمل رابطها القياسي، وحيث توجد اللغة الأخرى، زوج hreflang المتبادل والعربية هي الافتراضية.`,
      },
    },
  ];
}
