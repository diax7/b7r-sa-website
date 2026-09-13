import { draftMode } from 'next/headers';
import { Eye } from 'lucide-react';
import { Icon } from '@/components/shared/icon';
import { draftBarCopy } from '@/content/pages';

/**
 * A thin bar at the top of every page while an editor previews drafts (ADR-039): what they
 * see is not what visitors see, and one click leaves. Renders nothing outside draft mode,
 * which is the case for every static render.
 */
export async function DraftBar() {
  let enabled = false;
  try {
    enabled = (await draftMode()).isEnabled;
  } catch {
    return null;
  }
  if (!enabled) return null;
  // No `headers()` here: that would make every page dynamic. The exit route returns to the
  // referring page on its own.
  return (
    <div
      className="flex items-center justify-center gap-3 bg-warning px-4 py-2 text-small text-black"
      data-draft-bar=""
    >
      <Icon icon={Eye} size={16} />
      <span>{draftBarCopy.label}</span>
      {/* oxlint-disable-next-line no-html-link-for-pages -- a route handler that clears the cookie, not a page */}
      <a href="/api/preview/exit" className="font-medium underline underline-offset-4">
        {draftBarCopy.exit}
      </a>
    </div>
  );
}
