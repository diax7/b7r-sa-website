'use client';

import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui';
import { RefreshCw } from 'lucide-react';
import type { UIFieldClientComponent } from 'payload';
import { EngineAction } from '@/modules/ai-content/admin/engine-action';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.engine;

/**
 * "Regenerate" on an engine post (BRD 10.2.5), for admins: a new run from the post's topic
 * replaces the content under the same slug and cover. Payload's own Unpublish sits in the
 * status bar. Nothing on a hand-written post.
 */
export const PostEngineActions: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo();
  const { user } = useAuth();
  const origin = useFormFields(([fields]) => fields['origin']?.value);
  const role = (user as { role?: string } | null)?.role;
  if (typeof id !== 'number' || role !== 'admin' || (origin !== 'ai' && origin !== 'ai-edited')) {
    return null;
  }
  return (
    <div className="mb-6 flex flex-col gap-2" data-admin-ui="" data-admin-post-engine="">
      <span className="text-small font-medium text-text">{s.postTitle}</span>
      <span className="text-caption text-text-muted">{s.regenerateHint}</span>
      <EngineAction
        label={s.regenerate}
        busyLabel={s.queueing}
        doneLabel={s.queued}
        icon={RefreshCw}
        endpoint="/api/ai/regenerate"
        body={{ postId: id }}
        testId="regenerate"
      />
    </div>
  );
};
