import { adminStrings } from '@/modules/cms/admin/strings';

/** One line under the login form: the panel has no self-signup (BRD 9.3). */
export function AfterLogin() {
  return (
    <p className="mt-6 text-center text-caption text-text-muted" data-admin-after-login="">
      {adminStrings.login.noAccount}
    </p>
  );
}
