'use client';

import { RefreshCw } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.visibility.signals;

/** "Pull now" on the Score page (ADR-049 D4): queues the nightly pull once, admins only. */
export function PullNow() {
  return (
    <ApiAction
      label={s.pullNow}
      busyLabel={s.pulling}
      doneLabel={s.queued}
      icon={RefreshCw}
      endpoint="/api/visibility/pull"
      body={{}}
      testId="visibility-pull"
    />
  );
}
