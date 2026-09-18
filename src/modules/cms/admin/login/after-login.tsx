import type { ServerProps } from 'payload';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/** One line under the login form: the panel has no self-signup (BRD 9.3). */
export function AfterLogin({ i18n }: Pick<ServerProps, 'i18n'>) {
  return (
    <p className="mt-6 text-center text-caption text-text-muted" data-admin-after-login="">
      {adminStringsFor(i18n.language).login.noAccount}
    </p>
  );
}
