import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import {
  editHref,
  finding,
  globalHref,
  has,
  isHttps,
  loc,
  prorata,
} from '@/modules/visibility/rules/shared';

/** Identity (ADR-049 I1 to I4): one brand the engines can name and disambiguate. */
export function identity(s: Snapshot): Finding[] {
  const settings = globalHref(s.adminRoute, 'site-settings', 'en');
  const socials = (['x', 'instagram', 'tiktok'] as const).map((key) => ({
    ok: isHttps(s.site.social[key]),
    label: key === 'x' ? 'X' : key === 'instagram' ? 'Instagram' : 'TikTok',
    href: globalHref(s.adminRoute, 'site-settings'),
  }));
  const about = s.pages.find((p) => p.slug === 'about');
  const authorIds = new Set(s.posts.map((p) => p.author).filter((id): id is number => id !== null));
  const authors = s.authors
    .filter((a) => authorIds.has(a.id))
    .map((a) => ({
      ok: has(loc(a.bio, 'ar')) && a.photo !== null && a.sameAs > 0,
      label: loc(a.name, 'ar') || loc(a.name, 'en') || `#${a.id}`,
      href: editHref(s.adminRoute, 'authors', a.id),
    }));
  return [
    finding({
      key: 'I1',
      section: 'identity',
      status: has(loc(s.site.tagline, 'en')) ? 'done' : 'missing',
      title: 'The tagline exists in English',
      guide:
        'One sentence that says what B7R is, the same everywhere: the footer, llms.txt, the manifest and the store schema read it. Site settings → Brand, the English tab.',
      href: settings,
    }),
    prorata({
      key: 'I2',
      section: 'identity',
      checks: socials,
      title: 'The social profiles are links',
      guide:
        'The store schema names the profiles as sameAs so the engines tie them to the brand: each must be a full https:// address. Site settings → Contact & social.',
    }),
    finding({
      key: 'I3',
      section: 'identity',
      status: about ? (has(loc(about.title, 'en')) ? 'done' : 'next') : 'missing',
      title: 'The About page is published in both languages',
      guide:
        'The About page carries the facts an engine quotes (what, who for, since when, where from). Publish it, then fill its English tab.',
      ...(about ? { href: editHref(s.adminRoute, 'pages', about.id, 'en') } : {}),
    }),
    prorata({
      key: 'I4',
      section: 'identity',
      checks: authors,
      title: 'Every author has a bio, a photo and a profile link',
      guide:
        'A byline the engines can resolve to a person: the bio, the photo and one profile link (LinkedIn, X) on the author. Blog → Authors.',
    }),
  ];
}

export function identityFacts(): Fact[] {
  return [
    {
      section: 'identity',
      text: 'The tagline is read by the footer, llms.txt, the web app manifest and the OnlineStore schema (its slogan); the node names the profiles as sameAs.',
    },
    {
      section: 'identity',
      text: 'The Arabic tagline and the three profiles are required fields: a save without them is refused.',
    },
  ];
}
