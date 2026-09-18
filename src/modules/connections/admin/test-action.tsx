'use client';

import { useDocumentInfo, useFormModified } from '@payloadcms/ui';
import { PlugZap } from 'lucide-react';
import { ApiAction } from '@/modules/cms/admin/api-action';
import { useAdminStrings } from '@/modules/cms/admin/use-admin-strings';

/**
 * "Test connection" above a saved connection's form (ADR-047): one short call through the
 * stored key, the answer beside the button and recorded on the document. Absent on the
 * create form (nothing is stored yet) and held while the form is dirty, since the test
 * reads what is saved, not what is typed.
 */
export function TestConnection() {
  const s = useAdminStrings().connections;
  const { id } = useDocumentInfo();
  const modified = useFormModified();
  if (typeof id !== 'number') return null;
  return (
    <ApiAction
      label={s.test}
      busyLabel={s.testing}
      doneLabel={s.works}
      done={(json) => s.worksWith.replace('{model}', String(json['message'] ?? ''))}
      icon={PlugZap}
      endpoint="/api/connections/test"
      body={{ id }}
      testId="test-connection"
      {...(modified ? { disabled: s.saveFirst } : {})}
    />
  );
}
