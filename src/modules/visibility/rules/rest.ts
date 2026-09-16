import { fold } from '@/lib/arabic-fold';
import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import { finding, globalHref, prorata } from '@/modules/visibility/rules/shared';
import { BRAND_TERMS, CATEGORY_TERMS, THRESHOLDS } from '@/modules/visibility/rules/weights';

/** The checklist's five boxes (ADR-049 R1) and the guide each carries. */
export const CHECKLIST_ITEMS = [
  {
    key: 'linkedinCompany',
    label: 'LinkedIn company page',
    guide: 'The About text is the tagline; post a demo a week.',
  },
  {
    key: 'linkedinFounder',
    label: 'LinkedIn founder profile',
    guide:
      'The founder’s profile names B7R and links the site; it is the byline the engines resolve.',
  },
  {
    key: 'youtube',
    label: 'YouTube channel with a walkthrough',
    guide: 'One walkthrough of the designer with the full transcript in the description.',
  },
  {
    key: 'xProfile',
    label: 'X profile with a pinned demo',
    guide: 'Bio = the tagline; a pinned post shows the product.',
  },
  {
    key: 'firstMention',
    label: 'A first third-party mention',
    guide:
      'A guest post, a podcast or a directory that describes B7R in its own words with the category terms.',
  },
] as const;

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
      title: 'The off-site checklist is ticked',
      guide:
        'Engines trust a brand others describe. Do each item, then tick it under Visibility → Checklist; the guide beside each box says what counts.',
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
      title: `The traffic count received landings in the last ${landingDays} days`,
      guide:
        'The site’s own counter (Visibility → Traffic). No landings means the site is not live yet or the beacon is blocked; nothing to set.',
      href: `${s.adminRoute}/traffic`,
    }),
    prorata({
      key: 'M2',
      section: 'measurement',
      checks: (['ar', 'en'] as const).map((language) => ({
        ok: s.prompts.filter((p) => p.enabled && p.language === language).length >= promptsMin,
        label: language === 'ar' ? 'Arabic prompts' : 'English prompts',
        href: `${s.adminRoute}/collections/prompts`,
      })),
      title: `At least ${promptsMin} buyer prompts per language`,
      guide:
        'The questions a buyer asks an assistant, the ones B7R should be named for (Visibility → Prompts). The ledger asks them weekly.',
    }),
    finding({
      key: 'M3',
      section: 'measurement',
      status: ledgerRecent ? 'done' : s.lastLedgerRunAt ? 'next' : 'missing',
      title: `The citation ledger ran in the last ${ledgerDays} days`,
      guide:
        'The weekly run asks every enabled AI connection every prompt and records who named B7R. Needs an AI connection under Admin → Connections; "Run now" on this page starts one.',
    }),
  ];
}

export function measurementFacts(s: Snapshot): Fact[] {
  return [
    {
      section: 'measurement',
      text: s.gaConfigured
        ? 'GA4 is configured and loads after consent; its numbers live in Google’s UI.'
        : 'GA4 is not configured (NEXT_PUBLIC_GA_ID); the site’s own count does not need it.',
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
  // The median of the last three snapshots per URL, then the worst URL decides.
  const last = s.pagespeed.slice(-3);
  const urls = last[0]?.mobilePerformance.length ?? 0;
  const perUrl = Array.from({ length: urls }, (_, i) =>
    median(
      last.map((snap) => snap.mobilePerformance[i]).filter((n): n is number => n !== undefined),
    ),
  ).filter((n): n is number => n !== null);
  const worst = perUrl.length ? Math.min(...perUrl) : null;
  const rate = s.citedRate && s.citedRate.runs > 0 ? s.citedRate.cited / s.citedRate.runs : null;
  const top = s.searchConsole?.topQueries.slice(0, 10) ?? [];
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
      title: `PageSpeed mobile performance is ${pagespeed.done} or more on every audited page`,
      guide:
        worst === null
          ? 'Connect PageSpeed Insights under Admin → Connections; the nightly pull audits five pages and the median of three nights decides.'
          : `The worst of the five audited pages reads ${worst} (median of the last three nights). Images and third-party scripts are the usual weight; the Lighthouse report names the rest.`,
      href: connections,
    }),
    finding({
      key: 'P2',
      section: 'signals',
      status: s.searchConsole ? (s.searchConsole.impressions > 0 ? 'done' : 'missing') : 'missing',
      title: 'Google shows the site in results',
      guide: s.searchConsole
        ? 'Impressions over the last 28 days (Search Console). None means the site is not indexed yet or the property is wrong.'
        : 'Connect Search Console under Admin → Connections; the nightly pull reads impressions, clicks and queries.',
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
      title: 'A category term is among the top ten queries',
      guide:
        'A healthy brand’s top query is its name; a healthy site also ranks for what it sells (طباعة على الطلب, براند ملابس, print on demand). The answer-first posts and the compare page earn those.',
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
      title: `The assistants name B7R in ${Math.round(cited.done * 100)}% of the prompts`,
      guide:
        rate === null
          ? 'No ledger run on the non-brand prompts yet: connect an AI account and run the ledger.'
          : `Over four weeks B7R was named in ${Math.round(rate * 100)}% of the runs on the non-brand prompts. A prompt uncited everywhere names the page to improve.`,
    }),
  ];
}
