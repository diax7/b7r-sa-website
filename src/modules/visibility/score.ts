import { crawl, crawlFacts } from '@/modules/visibility/rules/crawl';
import { extractability, extractabilityFacts } from '@/modules/visibility/rules/extractability';
import { identity, identityFacts } from '@/modules/visibility/rules/identity';
import {
  corroboration,
  measurement,
  measurementFacts,
  signals,
} from '@/modules/visibility/rules/rest';
import { ITEMS, SECTIONS } from '@/modules/visibility/rules/weights';
import type { Fact, Finding, Section, Snapshot } from '@/modules/visibility/types';

export interface SectionScore {
  key: Section;
  label: string;
  weight: number;
  earned: number;
  percent: number;
  findings: Finding[];
  facts: Fact[];
}

export interface Score {
  /** Earned over 100. */
  overall: number;
  /** Earned over possible on the items that need no service or assistant. */
  siteOnly: number;
  sections: SectionScore[];
  findings: Finding[];
}

/** Every rule's answer, in the table's order. */
export function findings(s: Snapshot): Finding[] {
  const all = [
    ...identity(s),
    ...crawl(s),
    ...extractability(s),
    ...corroboration(s),
    ...measurement(s),
    ...signals(s),
  ];
  const order = new Map(ITEMS.map((i, n) => [i.key, n]));
  return all.toSorted((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));
}

export function facts(s: Snapshot): Fact[] {
  return [...identityFacts(), ...crawlFacts(s), ...extractabilityFacts(), ...measurementFacts(s)];
}

/** The two percentages and the per-section breakdown from a snapshot (pure). */
export function scoreOf(s: Snapshot): Score {
  const all = findings(s);
  const allFacts = facts(s);
  const sections = SECTIONS.map((section) => {
    const own = all.filter((f) => f.section === section.key);
    const earned = own.reduce((n, f) => n + f.earned, 0);
    return {
      key: section.key,
      label: section.label,
      weight: section.weight,
      earned,
      percent: Math.round((earned / section.weight) * 100),
      findings: own,
      facts: allFacts.filter((f) => f.section === section.key),
    };
  });
  const siteOnlyKeys = new Set(ITEMS.filter((i) => i.siteOnly).map((i) => i.key));
  const siteOnlyPossible = ITEMS.filter((i) => i.siteOnly).reduce((n, i) => n + i.weight, 0);
  const siteOnlyEarned = all
    .filter((f) => siteOnlyKeys.has(f.key))
    .reduce((n, f) => n + f.earned, 0);
  return {
    overall: Math.round(all.reduce((n, f) => n + f.earned, 0)),
    siteOnly: Math.round((siteOnlyEarned / siteOnlyPossible) * 100),
    sections,
    findings: all,
  };
}
