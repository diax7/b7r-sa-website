export { CtaRibbon } from '@/modules/core/cta-ribbon';
export { Footer, newsletterCopy } from '@/modules/core/footer';
export { Header } from '@/modules/core/header/header';
export { SkipLink } from '@/modules/core/skip-link';
export { StatusPage } from '@/modules/core/status-page';
export { WaveDivider } from '@/modules/core/wave-divider';
export { track, trackEvent, registerSink, type TrackEvent } from '@/modules/core/analytics/track';
export { AnalyticsBridge, announceConsent } from '@/modules/core/analytics/analytics-bridge';
export { NearViewport, AfterDelay } from '@/modules/core/lazy-mount';
export {
  buildMetadata,
  pageMetadata,
  postMetadata,
  productMetadata,
} from '@/modules/core/seo/metadata';
export { JsonLd } from '@/modules/core/seo/json-ld-script';
export * as jsonLd from '@/modules/core/seo/json-ld';
export { FaqAccordionLoader } from '@/modules/core/faq/faq-accordion-loader';
export { FaqStaticList } from '@/modules/core/faq/faq-static-list';
