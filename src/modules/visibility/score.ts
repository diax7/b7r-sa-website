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
import type { Fact, Finding, Language, Section, Snapshot, Text } from '@/modules/visibility/types';

export interface SectionScore<T = Text> {
  key: Section;
  weight: number;
  earned: number;
  percent: number;
  findings: Finding<T>[];
  facts: Fact<T>[];
}

/** The score as the rules answer it, every sentence in both languages; a page reads `Score<string>`. */
export interface Score<T = Text> {
  /** Earned over 100. */
  overall: number;
  /** Earned over possible on the items that need no service or assistant. */
  siteOnly: number;
  sections: SectionScore<T>[];
  findings: Finding<T>[];
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

function pickFinding(f: Finding, language: Language): Finding<string> {
  const { title, guide, items, ...rest } = f;
  return {
    ...rest,
    title: title[language],
    guide: guide[language],
    ...(items ? { items: items.map((i) => ({ label: i.label[language], href: i.href })) } : {}),
  };
}

/** The score with one language's sentences: what the Score page and the card render (ADR-056). */
export function pickScore(score: Score, language: Language): Score<string> {
  return {
    overall: score.overall,
    siteOnly: score.siteOnly,
    findings: score.findings.map((f) => pickFinding(f, language)),
    sections: score.sections.map((section) => ({
      ...section,
      findings: section.findings.map((f) => pickFinding(f, language)),
      facts: section.facts.map((fact) => ({ section: fact.section, text: fact.text[language] })),
    })),
  };
}
