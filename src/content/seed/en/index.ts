/**
 * The English values of the CMS content (Level 5, ADR-043): every localised field of the
 * seed, keyed like the Arabic seed it translates. `pnpm content:migrate` writes them into
 * the `en` locale after the Arabic document exists (and, with `--force`, into documents
 * whose English is still empty). Written by the agent from the Arabic seed and the facts of
 * BRD 1.1 and Appendix A; owed Dhia's read (Appendix G pattern). No em dashes.
 */
export { navigationEn } from '@/content/seed/en/navigation';
export { siteEn } from '@/content/seed/en/site';
export { seoEn } from '@/content/seed/en/seo';
export { homeEn } from '@/content/seed/en/home';
export { productsEn } from '@/content/seed/en/products';
export { faqEn } from '@/content/seed/en/faq';
export { integrationsEn } from '@/content/seed/en/integrations';
export { testimonialsEn } from '@/content/seed/en/testimonials';
export { pagesEn, legalEn } from '@/content/seed/en/pages';
export { mediaAltEn } from '@/content/seed/en/media';
