import { getTranslation } from '@payloadcms/translations';
import type { CollapsibleField, FieldLabelServerProps, GroupField } from 'payload';
import { Icon } from '@/components/shared/icon';
import { sectionIconOf } from '@/modules/cms/admin/icons';

/**
 * The label of a collapsible or a labelled group with its section icon before the words
 * (ADR-060), through Payload's own `admin.components.Label` slot, which `describeFields()`
 * fills on every collapsible or group that names an icon through `sectionIcon()`. The
 * markup is the one Payload's fallback renders (`span.row-label` inside the collapsible's
 * flex header; `h3.group-field__title` over `span.field-label` for a group), so Payload's
 * own styles keep applying; the icon is the text colour, 16 px, decorative.
 */
export function SectionLabel(props: FieldLabelServerProps<CollapsibleField | GroupField>) {
  const { field, i18n } = props;
  const label = field.label ? getTranslation(field.label, i18n) : '';
  const SectionIcon = sectionIconOf(field.admin);
  const key = String(field.admin?.custom?.['icon'] ?? '');
  const icon = SectionIcon && (
    <span
      className="me-2 inline-flex shrink-0 items-center align-middle"
      data-admin-section-icon={key}
    >
      <Icon icon={SectionIcon} size={16} />
    </span>
  );
  if (field.type === 'group') {
    return (
      <h3 className="group-field__title">
        {icon}
        <span className="field-label">{label}</span>
      </h3>
    );
  }
  return (
    <span className="row-label" style={{ pointerEvents: 'none' }}>
      {icon}
      {label}
    </span>
  );
}
