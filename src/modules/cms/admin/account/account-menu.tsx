'use client';

import { Link } from '@payloadcms/ui';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Badge } from '@/components/shared/badge';
import { Icon } from '@/components/shared/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initials } from '@/modules/cms/admin/account/initials';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.account;

/**
 * The account block at the foot of the sidebar: who is signed in, and where to go from here.
 * In the icon rail the CSS hides the name and e-mail (`data-rail-hide`); the avatar keeps the
 * menu. `compact` only widens the accessible label once the client knows it is a rail.
 */
export function AccountMenu({
  account,
  adminRoute,
  compact = false,
}: {
  account: { name: string; email: string; role: string };
  adminRoute: string;
  compact?: boolean;
}) {
  const role = s.roles[account.role] ?? account.role;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2.5 rounded-inner p-2 text-start transition-colors duration-(--duration-fast) hover:bg-accent-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 data-[state=open]:bg-accent-tint"
        aria-label={compact ? `${s.menu}: ${account.name}` : s.menu}
        data-admin-account=""
        data-rail-center=""
      >
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-pill bg-primary text-small font-medium text-white"
        >
          {initials(account.name, account.email)}
        </span>
        <span className="min-w-0 flex-1" data-rail-hide="">
          <span className="block truncate text-small font-medium text-text">{account.name}</span>
          <span className="block truncate text-caption text-text-muted" dir="ltr">
            {account.email}
          </span>
        </span>
        <Icon icon={ChevronDown} size={16} className="shrink-0 text-text-muted" data-rail-hide="" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="min-w-56" data-admin-ui="">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate">{account.name}</span>
          {role && (
            <Badge tone={account.role === 'admin' ? 'success' : 'muted'} className="shrink-0">
              {role}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`${adminRoute}/account`}>
            <Icon icon={UserRound} size={16} />
            {s.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-error data-highlighted:text-error">
          <a href={`${adminRoute}/logout`} data-admin-logout="">
            <Icon icon={LogOut} size={16} />
            {s.logout}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
