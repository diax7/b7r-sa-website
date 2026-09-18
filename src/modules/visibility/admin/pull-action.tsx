'use client';

import { RefreshCw } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** "Pull now" on the Score page (ADR-049 D4): queues the nightly pull once, admins only. */
export function PullNow() {
  const s = useAdminStrings().visibility.signals;
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
