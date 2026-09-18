'use client';

import { MessageCircleQuestion } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/** "Run now" on the Score page (ADR-049 D5): queues the citation ledger once, admins only. */
export function RunLedger() {
  const s = useAdminStrings().visibility.ledger;
  return (
    <ApiAction
      label={s.runNow}
      busyLabel={s.queuing}
      doneLabel={s.queued}
      icon={MessageCircleQuestion}
      endpoint="/api/visibility/ledger"
      body={{}}
      testId="visibility-ledger"
    />
  );
}
