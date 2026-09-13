import { cn } from '@/lib/cn';

interface ProseProps {
  /** Server-rendered HTML from `lib/markdown.ts` (trusted repo content). */
  html: string;
  className?: string;
}

/** Long-form text block (BRD 6.11, 6.12): max-width 760, headings, lists, links styled in globals.css. */
export function Prose({ html, className }: ProseProps) {
  return (
    <div
      className={cn('prose', className)}
      // The HTML comes from our own Markdown files via lib/markdown.ts, never from user input.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
