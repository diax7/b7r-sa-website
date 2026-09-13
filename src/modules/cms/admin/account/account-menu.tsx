'use client';

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
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.account;

/** Up to two initials from the name (Arabic or Latin); the e-mail's first letter otherwise. */
export function initials(name: string, email: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0] ?? '');
  const out = letters.join('');
  return out || email[0]?.toUpperCase() || '؟';
}

/** The account block at the foot of the sidebar: who is signed in, and where to go from here. */
export function AccountMenu({
  account,
  adminRoute,
}: {
  account: { name: string; email: string; role: string };
  adminRoute: string;
}) {
  const role = s.roles[account.role] ?? account.role;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full items-center gap-2.5 rounded-inner px-2 py-2 text-start transition-colors duration-(--duration-fast) hover:bg-accent-tint focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40 data-[state=open]:bg-accent-tint"
        aria-label={s.menu}
        data-admin-account=""
      >
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-pill bg-primary text-small font-medium text-white"
        >
          {initials(account.name, account.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-small font-medium text-text">{account.name}</span>
          <span className="block truncate text-caption text-text-muted" dir="ltr">
            {account.email}
          </span>
        </span>
        <Icon icon={ChevronDown} size={16} className="shrink-0 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-(--radix-dropdown-menu-trigger-width)"
        data-admin-ui=""
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="truncate">{account.name}</span>
          {role && (
            <Badge tone={account.role === 'admin' ? 'warning' : 'success'} className="shrink-0">
              {role}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`${adminRoute}/account`}>
            <Icon icon={UserRound} size={16} />
            {s.profile}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${adminRoute}/logout`} data-admin-logout="">
            <Icon icon={LogOut} size={16} />
            {s.logout}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
