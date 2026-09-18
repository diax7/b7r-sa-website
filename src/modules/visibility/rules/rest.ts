import { fold } from '@/lib/arabic-fold';
import type { Fact, Finding, Snapshot, Text } from '@/modules/visibility/types';
import { finding, globalHref, prorata } from '@/modules/visibility/rules/shared';
import { BRAND_TERMS, CATEGORY_TERMS, THRESHOLDS } from '@/modules/visibility/rules/weights';

/**
 * The checklist's five boxes (ADR-049 R1): the global's fields and R1's listed items carry
 * these labels; what counts for each box is its field description (`descriptions.ts`).
 */
export const CHECKLIST_ITEMS: ReadonlyArray<{ key: string; label: Text }> = [
  {
    key: 'linkedinCompany',
    label: { en: 'LinkedIn company page', ar: 'صفحة الشركة على LinkedIn' },
  },
  {
    key: 'linkedinFounder',
    label: { en: 'LinkedIn founder profile', ar: 'حساب المؤسس على LinkedIn' },
  },
  {
    key: 'youtube',
    label: { en: 'YouTube channel with a walkthrough', ar: 'قناة YouTube بشرح واحد' },
  },
  { key: 'xProfile', label: { en: 'X profile with a pinned demo', ar: 'حساب X بمنشور مثبّت' } },
  { key: 'firstMention', label: { en: 'A first third-party mention', ar: 'أول ذكر من طرف ثالث' } },
];

/** Corroboration (R1): what others say about the brand, as far as the admin can tick it. */
export function corroboration(s: Snapshot): Finding[] {
  const href = globalHref(s.adminRoute, 'visibility-checklist');
  return [
    prorata({
      key: 'R1',
      section: 'corroboration',
      checks: CHECKLIST_ITEMS.map((item) => ({
        ok: s.checklist[item.key] === true,
        label: item.label,
        href,
      })),
      title: {
        en: 'The off-site checklist is ticked',
        ar: 'قائمة الحضور الخارجي معلَّمة',
      },
      guide: {
        en: 'Engines trust a brand others describe. Do each item, then tick it under Visibility, Off-site checklist; the note under each box says what counts.',
        ar: 'المحرّكات تثق بعلامة يصفها الآخرون. أنجز كل بند، ثم علّمه في الظهور، قائمة الحضور الخارجي؛ والسطر تحت كل خانة يقول ما يُحتسب.',
      },
      href,
    }),
  ];
}

/** Measurement (M1 to M3): the counter and the ledger are receiving. */
export function measurement(s: Snapshot): Finding[] {
  const { promptsMin, ledgerDays, landingDays } = THRESHOLDS;
  const ledgerRecent =
    s.lastLedgerRunAt !== null &&
    new Date(s.at).getTime() - new Date(s.lastLedgerRunAt).getTime() <= ledgerDays * 86_400_000;
  return [
    finding({
      key: 'M1',
      section: 'measurement',
      status: s.landings30d > 0 ? 'done' : 'missing',
      title: {
        en: `The traffic count received landings in the last ${landingDays} days`,
        ar: `عدّاد الزيارات سجّل زيارات في آخر ${landingDays} يوماً`,
      },
      guide: {
        en: 'The site’s own counter (Visibility, Traffic). No landings means the site is not live yet or the beacon is blocked; nothing to set.',
        ar: 'عدّاد الموقع نفسه (الظهور، مصادر الزيارات). لا زيارات يعني أن الموقع لم يُطلق بعد أو أن الإشارة محجوبة؛ لا شيء يُضبط.',
      },
      href: `${s.adminRoute}/traffic`,
    }),
    prorata({
      key: 'M2',
      section: 'measurement',
      checks: (['ar', 'en'] as const).map((language) => ({
        ok: s.prompts.filter((p) => p.enabled && p.language === language).length >= promptsMin,
        label:
          language === 'ar'
            ? { en: 'Arabic prompts', ar: 'الأسئلة العربية' }
            : { en: 'English prompts', ar: 'الأسئلة الإنجليزية' },
        href: `${s.adminRoute}/collections/prompts`,
      })),
      title: {
        en: `At least ${promptsMin} buyer prompts per language`,
        ar: `${promptsMin} أسئلة مشترين على الأقل لكل لغة`,
      },
      guide: {
        en: 'The questions a buyer asks an assistant, the ones B7R should be named for (Visibility, Prompts). The ledger asks each on its period.',
        ar: 'الأسئلة التي يطرحها المشتري على مساعد ذكاء اصطناعي، والتي ينبغي أن يُذكر بحر برنت فيها (الظهور، أسئلة المشترين). السجل يطرح كلاً منها بحسب دوريته.',
      },
    }),
    finding({
      key: 'M3',
      section: 'measurement',
      status: ledgerRecent ? 'done' : s.lastLedgerRunAt ? 'next' : 'missing',
      title: {
        en: `The citation ledger ran in the last ${ledgerDays} days`,
        ar: `سجل الاستشهادات عمل في آخر ${ledgerDays} يوماً`,
      },
      guide: {
        en: 'The morning run asks every enabled AI connection the prompts due on their period and records who named B7R. Needs an AI connection under Admin, Connections; "Run now" on this page asks every prompt at once.',
        ar: 'جولة الصباح تسأل كل اتصال ذكاء اصطناعي مفعّل الأسئلة المستحقة بحسب دوريتها وتسجّل من ذكر بحر برنت. تحتاج اتصال ذكاء اصطناعي في الإدارة، الاتصالات؛ و«شغّل الآن» في هذه الصفحة يطرح كل الأسئلة دفعة واحدة.',
      },
    }),
  ];
}

export function measurementFacts(s: Snapshot): Fact[] {
  return [
    {
      section: 'measurement',
      text: s.gaConfigured
        ? {
            en: 'GA4 is configured and loads after consent; its numbers live in Google’s own pages.',
            ar: 'GA4 مضبوط ويُحمَّل بعد الموافقة؛ وأرقامه في صفحات Google نفسها.',
          }
        : {
            en: 'GA4 is not configured (Site settings, the Analytics tab); the site’s own count does not need it.',
            ar: 'GA4 غير مضبوط (إعدادات الموقع، تبويب التحليلات)؛ وعدّاد الموقع لا يحتاجه.',
          },
    },
  ];
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].toSorted((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)] ?? null;
}

/** A brand query names us; a category query carries one of the terms the site is for. */
export function isBrandQuery(query: string): boolean {
  const q = fold(query.toLowerCase());
  return BRAND_TERMS.some((term) => q.includes(fold(term)));
}

export function isCategoryQuery(query: string): boolean {
  const q = fold(query.toLowerCase());
  return CATEGORY_TERMS.some((term) => q.includes(fold(term.toLowerCase())));
}

/** Outside signals (P1 to P4): what Google, Bing and the assistants say. */
export function signals(s: Snapshot): Finding[] {
  const { pagespeed, cited } = THRESHOLDS;
  const connections = `${s.adminRoute}/collections/connections`;
  // The median of the last three snapshots per URL (a night that failed a URL is left out
  // for that URL), then the worst URL decides.
  const last = s.pagespeed.slice(-3);
  const urls = new Set(last.flatMap((snap) => Object.keys(snap.mobilePerformance)));
  const perUrl = [...urls]
    .map((url) =>
      median(
        last.map((snap) => snap.mobilePerformance[url]).filter((n): n is number => n !== undefined),
      ),
    )
    .filter((n): n is number => n !== null);
  const worst = perUrl.length ? Math.min(...perUrl) : null;
  const rate = s.citedRate && s.citedRate.runs > 0 ? s.citedRate.cited / s.citedRate.runs : null;
  const top = s.searchConsole?.topQueries.slice(0, 10) ?? [];
  const citedDone = Math.round(cited.done * 100);
  return [
    finding({
      key: 'P1',
      section: 'signals',
      status:
        worst === null
          ? 'missing'
          : worst >= pagespeed.done
            ? 'done'
            : worst >= pagespeed.next
              ? 'next'
              : 'missing',
      title: {
        en: `PageSpeed mobile performance is ${pagespeed.done} or more on every audited page`,
        ar: `أداء PageSpeed على الجوال ${pagespeed.done} أو أكثر في كل صفحة مفحوصة`,
      },
      guide:
        worst === null
          ? {
              en: 'Connect PageSpeed Insights under Admin, Connections; the nightly pull audits five pages and the median of three nights decides.',
              ar: 'اربط PageSpeed Insights في الإدارة، الاتصالات؛ السحب الليلي يفحص خمس صفحات، والوسيط من ثلاث ليالٍ هو الحكم.',
            }
          : {
              en: `The worst of the five audited pages reads ${worst} (median of the last three nights). Images and third-party scripts are the usual weight; the Lighthouse report names the rest.`,
              ar: `أسوأ الصفحات الخمس المفحوصة تقرأ ${worst} (الوسيط من آخر ثلاث ليالٍ). الصور وسكربتات الطرف الثالث هي الثقل المعتاد؛ وتقرير Lighthouse يسمّي البقية.`,
            },
      href: connections,
    }),
    finding({
      key: 'P2',
      section: 'signals',
      status: s.searchConsole ? (s.searchConsole.impressions > 0 ? 'done' : 'missing') : 'missing',
      title: {
        en: 'Google shows the site in results',
        ar: 'Google يعرض الموقع في النتائج',
      },
      guide: s.searchConsole
        ? {
            en: 'Impressions over the last 28 days (Search Console). None means the site is not indexed yet or the site registered in Search Console is the wrong one.',
            ar: 'مرات الظهور في آخر 28 يوماً (Search Console). صفر يعني أن الموقع لم يُفهرس بعد أو أن الموقع المسجّل في Search Console غير صحيح.',
          }
        : {
            en: 'Connect Search Console under Admin, Connections; the nightly pull reads impressions, clicks and queries.',
            ar: 'اربط Search Console في الإدارة، الاتصالات؛ السحب الليلي يقرأ مرات الظهور والنقرات والاستعلامات.',
          },
      href: connections,
    }),
    finding({
      key: 'P3',
      section: 'signals',
      status:
        top.length === 0
          ? 'missing'
          : top.some((q) => !isBrandQuery(q) && isCategoryQuery(q))
            ? 'done'
            : 'next',
      title: {
        en: 'A category term is among the top ten queries',
        ar: 'مصطلح من الفئة بين أعلى عشرة استعلامات',
      },
      guide: {
        en: 'A healthy brand’s top query is its name; a healthy site also ranks for what it sells (طباعة على الطلب, براند ملابس, print on demand). The answer-first posts and the compare page earn those.',
        ar: 'أعلى استعلام لعلامة سليمة هو اسمها؛ والموقع السليم يتصدّر أيضاً فيما يبيعه (طباعة على الطلب، براند ملابس، print on demand). المقالات التي تبدأ بالإجابة وصفحة المقارنة تكسب ذلك.',
      },
      href: connections,
    }),
    finding({
      key: 'P4',
      section: 'signals',
      status:
        rate === null
          ? 'missing'
          : rate >= cited.done
            ? 'done'
            : rate >= cited.next
              ? 'next'
              : 'missing',
      title: {
        en: `The assistants name B7R in ${citedDone}% of the prompts`,
        ar: `المساعدون يذكرون بحر برنت في ${citedDone}% من الأسئلة`,
      },
      guide:
        rate === null
          ? {
              en: 'No ledger run on the non-brand prompts yet: connect an AI account and run the ledger.',
              ar: 'لا جولة سجل بعد على الأسئلة التي لا تذكر العلامة: اربط حساب ذكاء اصطناعي وشغّل السجل.',
            }
          : {
              en: `Over four weeks B7R was named in ${Math.round(rate * 100)}% of the runs on the non-brand prompts. A prompt uncited everywhere names the page to improve.`,
              ar: `خلال أربعة أسابيع ذُكر بحر برنت في ${Math.round(rate * 100)}% من الجولات على الأسئلة التي لا تذكر العلامة. والسؤال الذي لا يذكره أي محرّك يسمّي الصفحة التي تحتاج تحسيناً.`,
            },
    }),
  ];
}
