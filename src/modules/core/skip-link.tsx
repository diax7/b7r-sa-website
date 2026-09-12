import { navigation } from '@/content/navigation';

/** First focusable element on every page (BRD 3.13). */
export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only z-[60] rounded-base bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:start-3"
    >
      {navigation.skipLinkLabel}
    </a>
  );
}
