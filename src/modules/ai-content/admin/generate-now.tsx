'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { Sparkles } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.engine;

/** "Generate now" in a topic's edit view (BRD 10.2.7): queues one run for this topic. */
export function GenerateNow() {
  const { id } = useDocumentInfo();
  if (typeof id !== 'number') return null;
  return (
    <ApiAction
      label={s.generateNow}
      busyLabel={s.queueing}
      doneLabel={s.queued}
      icon={Sparkles}
      endpoint="/api/ai/generate"
      body={{ topicId: id }}
      testId="generate-now"
    />
  );
}
