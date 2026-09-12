import { getRequestConfig } from 'next-intl/server';

/**
 * next-intl without i18n routing (ADR-003): a single locale `ar` at the root. UI microcopy
 * (aria labels, hints) lives in `messages/ar.json`; page copy lives in typed content files.
 * Components import the JSON directly and pass strings to islands as props, so no provider
 * or client runtime ships; `getTranslations()` becomes useful once `en` exists.
 */
export default getRequestConfig(async () => ({
  locale: 'ar',
  messages: (await import('../messages/ar.json')).default,
}));
