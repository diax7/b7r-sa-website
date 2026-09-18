import { Check, X } from 'lucide-react';
import type { DefaultServerCellComponentProps } from 'payload';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import { adminStringsFor } from '@/modules/cms/admin/strings';

/**
 * A checkbox in a list as a coloured badge (design system: green is live or yes, red is off
 * or no), in place of Payload's `true` / `false` pills. An `enabled` field reads On / Off;
 * any other checkbox reads Yes / No; an unset value reads as a muted dash-less "not yet".
 */
export function BoolCell({ cellData, field, i18n }: DefaultServerCellComponentProps) {
  const s = adminStringsFor(i18n.language).cells;
  const name = 'name' in field ? String(field.name) : '';
  const words = name === 'enabled' ? s.onOff : s.yesNo;
  if (cellData !== true && cellData !== false) {
    return <Badge tone="muted">{s.notYet}</Badge>;
  }
  return (
    <Badge tone={cellData ? 'success' : 'error'} className="gap-1" data-admin-bool={cellData}>
      <Icon icon={cellData ? Check : X} size={12} />
      {cellData ? words[0] : words[1]}
    </Badge>
  );
}
