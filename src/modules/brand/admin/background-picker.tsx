import type { TextFieldServerComponent } from 'payload';
import { BackgroundChoices } from '@/modules/brand/admin/background-choices';
import { backgroundOptions } from '@/modules/brand/admin/background-options';

/**
 * A section's background picker (spec 010, phase 2), on every home section that may take a
 * set and on every page block. A server component: it reads the library where the editor's
 * own access could not, and hands the choices to the radiogroup.
 */
export const BackgroundPicker: TextFieldServerComponent = async ({
  payload,
  i18n,
  clientField,
  path,
  readOnly,
}) => {
  const choices = await backgroundOptions(payload, i18n.language);
  return <BackgroundChoices field={clientField} path={path} readOnly={readOnly} {...choices} />;
};
