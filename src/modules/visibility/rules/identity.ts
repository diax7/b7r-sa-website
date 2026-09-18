import type { Fact, Finding, Snapshot } from '@/modules/visibility/types';
import {
  editHref,
  finding,
  globalHref,
  has,
  isHttps,
  loc,
  prorata,
  same,
} from '@/modules/visibility/rules/shared';

/** Identity (ADR-049 I1 to I4): one brand the engines can name and disambiguate. */
export function identity(s: Snapshot): Finding[] {
  const settings = globalHref(s.adminRoute, 'site-settings', 'tagline');
  const socials = (['x', 'instagram', 'tiktok'] as const).map((key) => ({
    ok: isHttps(s.site.social[key]),
    label: same(key === 'x' ? 'X' : key === 'instagram' ? 'Instagram' : 'TikTok'),
    href: globalHref(s.adminRoute, 'site-settings'),
  }));
  const about = s.pages.find((p) => p.slug === 'about');
  const authorIds = new Set(s.posts.map((p) => p.author).filter((id): id is number => id !== null));
  const authors = s.authors
    .filter((a) => authorIds.has(a.id))
    .map((a) => ({
      ok: has(loc(a.bio, 'ar')) && a.photo !== null && a.sameAs > 0,
      label: same(loc(a.name, 'ar') || loc(a.name, 'en') || `#${a.id}`),
      href: editHref(s.adminRoute, 'authors', a.id),
    }));
  return [
    finding({
      key: 'I1',
      section: 'identity',
      status: has(loc(s.site.tagline, 'en')) ? 'done' : 'missing',
      title: {
        en: 'The tagline exists in English',
        ar: 'الشعار النصي مكتوب بالإنجليزية',
      },
      guide: {
        en: 'One sentence that says what B7R is, the same everywhere: the footer, llms.txt, the app manifest and the store schema read it. Site settings, the Brand tab, the English field beside the Arabic tagline.',
        ar: 'جملة واحدة تعرّف بحر برنت، هي نفسها في كل مكان: يقرؤها التذييل وملف llms.txt وبيان التطبيق ومخطط المتجر. إعدادات الموقع، تبويب العلامة، الحقل الإنجليزي بجانب الشعار النصي العربي.',
      },
      href: settings,
    }),
    prorata({
      key: 'I2',
      section: 'identity',
      checks: socials,
      title: {
        en: 'The social profiles are links',
        ar: 'حسابات التواصل روابط كاملة',
      },
      guide: {
        en: 'The store schema lists the profiles so the engines tie them to the brand: each must be a full https:// address. Site settings, the Contact & social tab.',
        ar: 'مخطط المتجر يذكر الحسابات لتربطها المحرّكات بالعلامة: كل حساب عنوان كامل يبدأ بـ https://. إعدادات الموقع، تبويب التواصل والحسابات.',
      },
    }),
    finding({
      key: 'I3',
      section: 'identity',
      status: about ? (has(loc(about.title, 'en')) ? 'done' : 'next') : 'missing',
      title: {
        en: 'The About page is published in both languages',
        ar: 'صفحة «من نحن» منشورة باللغتين',
      },
      guide: {
        en: 'The About page carries the facts an engine quotes (what, who for, since when, where from). Publish it, then fill the English fields beside the Arabic ones, the title first.',
        ar: 'صفحة «من نحن» تحمل الحقائق التي يقتبسها المحرّك (ما هو، لمن، منذ متى، من أين). انشرها، ثم املأ الحقول الإنجليزية بجانب العربية، والعنوان أولاً.',
      },
      ...(about ? { href: editHref(s.adminRoute, 'pages', about.id, 'title') } : {}),
    }),
    prorata({
      key: 'I4',
      section: 'identity',
      checks: authors,
      title: {
        en: 'Every author has a bio, a photo and a profile link',
        ar: 'لكل كاتب نبذة وصورة ورابط حساب',
      },
      guide: {
        en: 'A byline the engines can resolve to a person: the bio, the photo and one profile link (LinkedIn, X) on the author. Blog, Authors.',
        ar: 'توقيع تحلّه المحرّكات إلى شخص: النبذة والصورة ورابط حساب واحد (LinkedIn أو X) على صفحة الكاتب. المدونة، الكتّاب.',
      },
    }),
  ];
}

export function identityFacts(): Fact[] {
  return [
    {
      section: 'identity',
      text: {
        en: 'The footer, llms.txt, the app manifest and the store schema all read the tagline; the schema lists the profiles.',
        ar: 'التذييل وملف llms.txt وبيان التطبيق ومخطط المتجر تقرأ كلها الشعار النصي؛ والمخطط يذكر الحسابات.',
      },
    },
    {
      section: 'identity',
      text: {
        en: 'The Arabic tagline and the three profiles are required fields: a save without them is refused.',
        ar: 'الشعار النصي العربي والحسابات الثلاثة حقول إلزامية: لا يُحفظ الإعداد بدونها.',
      },
    },
  ];
}
