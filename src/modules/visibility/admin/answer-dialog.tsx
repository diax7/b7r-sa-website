'use client';

import { FileText, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/shared/icon';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.visibility.ledger;

/**
 * "View answer" on a ledger cell: the engine's whole answer in a dialog, rendered on the
 * server as prose (headings, lists, links) and handed in as children; the links it cited
 * under it. Escape and the close button leave it; the page behind keeps its state.
 */
export function AnswerDialog({
  title,
  urls,
  children,
}: {
  title: string;
  urls: string[];
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex items-center gap-1 rounded-base px-2 py-1 text-caption text-accent underline underline-offset-2 hover:bg-surface-2"
        data-admin-answer-open=""
      >
        <Icon icon={FileText} size={12} />
        {s.viewAnswer}
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        data-admin-ui=""
        data-admin-answer=""
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-h4 text-text">{title}</DialogTitle>
            <DialogDescription className="text-caption text-text-muted">
              {s.answerHint}
            </DialogDescription>
          </div>
          <DialogClose
            className="rounded-base p-1 text-text-muted hover:bg-surface-2"
            aria-label={s.close}
          >
            <Icon icon={X} size={16} />
          </DialogClose>
        </div>
        <div className="mt-4" dir="auto">
          {children}
        </div>
        {urls.length > 0 && (
          <ul className="mt-4 flex flex-col gap-1 border-t border-border pt-3 text-caption text-text-muted">
            {urls.map((url) => (
              <li key={url} className="truncate font-mono" dir="ltr">
                {url}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
