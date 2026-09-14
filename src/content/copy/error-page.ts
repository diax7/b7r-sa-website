import type { Locale } from '@/lib/i18n';

export interface ErrorPageCopy {
  title: string;
  text: string;
  button: string;
}

/**
 * The error boundaries' copy (BRD 8.11), in a module of its own: error boundaries are
 * client components, and importing a bank there ships both languages to every page. The
 * banks reference these values so the shape and Appendix I stay whole.
 */
export const ERROR_PAGE: Record<Locale, ErrorPageCopy> = {
  ar: {
    title: 'حدث خطأ غير متوقع',
    text: 'حاول تحديث الصفحة، أو راسلنا على واتساب.',
    button: 'العودة للرئيسية',
  },
  en: {
    title: 'Something went wrong',
    text: 'Try refreshing the page, or message us on WhatsApp.',
    button: 'Back to the home page',
  },
};
