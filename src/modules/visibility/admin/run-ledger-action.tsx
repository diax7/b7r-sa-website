'use client';

import { MessageCircleQuestion } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.visibility.ledger;

/** "Run now" on the Score page (ADR-049 D5): queues the citation ledger once, admins only. */
export function RunLedger() {
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
