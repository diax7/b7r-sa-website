// The barrel is for server components. A client component imports the module it needs
// directly: Turbopack keeps a re-exported module's imports in the client graph even when
// its exports go unused, so a client import of this index dragged the footer's brand glyphs
// and the status page into every route's first-paint JS, and a client component re-exported
// here (the FAQ accordion) joined every route's bundle through the site document (site audit
// 2026-09-18, item 12). `CtaRibbon` reads the CMS: import it from '@/modules/core/cta-ribbon'.
export { Footer, newsletterCopy } from '@/modules/core/footer';
export { Header } from '@/modules/core/header/header';
export { SkipLink } from '@/modules/core/skip-link';
export { StatusPage } from '@/modules/core/status-page';
export { WaveDivider } from '@/modules/core/wave-divider';
export { track, trackEvent, registerSink, type TrackEvent } from '@/modules/core/analytics/track';
export { AnalyticsBridge, announceConsent } from '@/modules/core/analytics/analytics-bridge';
export { NearViewport, AfterDelay } from '@/modules/core/lazy-mount';
// Metadata helpers read the CMS (server only) and are imported from
// '@/modules/core/seo/metadata' directly.
export { JsonLd } from '@/modules/core/seo/json-ld-script';
export * as jsonLd from '@/modules/core/seo/json-ld';
