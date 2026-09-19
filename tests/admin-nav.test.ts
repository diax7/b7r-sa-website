import { array, assert, nat, property, string } from 'fast-check';
import type { Payload } from 'payload';
import { describe, expect, it } from 'vitest';
import { fold } from '@/lib/arabic-fold';
import {
  activeGroupKey,
  activeRowKey,
  groupEntities,
  groupIsOpen,
  isActive,
  isDashboard,
} from '@/modules/cms/admin/nav/active';
import { BADGE_ENTRY, BADGE_TONE, badgeFor, navBadges } from '@/modules/cms/admin/nav/badges';
import type { NavEntity, NavGroup } from '@/modules/cms/admin/nav/groups';
import {
  isTypeahead,
  type NavRow,
  nextRowIndex,
  rowKey,
  rowStartingWith,
  tabbableRow,
  treeRows,
} from '@/modules/cms/admin/nav/keyboard';
import { badgeStrings } from '@/modules/cms/admin/nav/badge-strings';
import { groupBlocks } from '@/modules/cms/admin/nav/order';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';
import { overLimitConnections } from '@/modules/connections/spend';

/**
 * The sidebar's pure pieces (ADR-058): the keyboard model, which entry is the current page
 * and which group opens, and the badge rule.
 */
const entity = (
  type: NavEntity['type'],
  slug: string,
  label: string,
  children: NavEntity[] = [],
): NavEntity => ({
  type,
  slug,
  label,
  href: `/admin/${type}/${slug}`,
  children,
});

const groups: NavGroup[] = [
  {
    key: 'site',
    label: 'Site',
    hue: 'blue',
    entities: [entity('globals', 'home', 'Home page'), entity('collections', 'pages', 'Pages')],
    sections: [
      {
        key: 'inbox',
        label: 'Inbox',
        place: 'first',
        entities: [entity('collections', 'messages', 'Messages')],
      },
    ],
  },
  {
    key: 'blog',
    label: 'Blog',
    hue: 'violet',
    entities: [
      entity('collections', 'posts', 'Posts', [entity('collections', 'authors', 'Authors')]),
    ],
    sections: [
      {
        key: 'engine',
        label: 'Content engine',
        place: 'last',
        entities: [entity('collections', 'ai-runs', 'Runs')],
      },
    ],
  },
];

const rows: NavRow[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'group:site', label: 'Site' },
  { key: 'collections:messages', label: 'Messages' },
  { key: 'globals:home', label: 'Home page' },
  { key: 'collections:pages', label: 'Pages' },
  { key: 'group:blog', label: 'Blog' },
  { key: 'collections:posts', label: 'Posts' },
];

describe('the keyboard model: arrows, Home, End, a typed letter', () => {
  it('walks down and up without wrapping, jumps to the ends', () => {
    expect(nextRowIndex(rows, 0, 'ArrowDown')).toBe(1);
    expect(nextRowIndex(rows, 6, 'ArrowDown')).toBe(6);
    expect(nextRowIndex(rows, 3, 'ArrowUp')).toBe(2);
    expect(nextRowIndex(rows, 0, 'ArrowUp')).toBe(0);
    expect(nextRowIndex(rows, 4, 'Home')).toBe(0);
    expect(nextRowIndex(rows, 1, 'End')).toBe(6);
  });

  it('leaves the other keys to the rows and answers nothing for an empty tree', () => {
    for (const key of ['Enter', ' ', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Shift']) {
      expect(nextRowIndex(rows, 2, key), key).toBeNull();
    }
    expect(nextRowIndex([], 0, 'ArrowDown')).toBeNull();
    expect(isTypeahead(' ')).toBe(false);
    expect(isTypeahead('Enter')).toBe(false);
    expect(isTypeahead('p')).toBe(true);
    expect(isTypeahead('ص')).toBe(true);
  });

  it('a letter jumps to the next row starting with it, wrapping, the current row last', () => {
    expect(nextRowIndex(rows, 0, 'p')).toBe(4);
    expect(nextRowIndex(rows, 4, 'p')).toBe(6);
    expect(nextRowIndex(rows, 6, 'P')).toBe(4);
    expect(nextRowIndex(rows, 4, 'x')).toBeNull();
    expect(nextRowIndex(rows, 0, 'm')).toBe(2);
    expect(rowStartingWith(rows, 1, 's')).toBe(1);
    const arabic: NavRow[] = [
      { key: 'a', label: 'الموقع' },
      { key: 'b', label: 'أدوات' },
      { key: 'c', label: 'Pages' },
    ];
    expect(rowStartingWith(arabic, 0, 'ا')).toBe(1);
    expect(rowStartingWith(arabic, 1, 'ا')).toBe(0);
  });

  it('always lands on a row whose label starts with the letter, or on nothing', () => {
    assert(
      property(
        array(string({ minLength: 1, maxLength: 12 }), { minLength: 1, maxLength: 20 }),
        nat(),
        string({ minLength: 1, maxLength: 1 }),
        (labels, at, char) => {
          const list = labels.map((label, i) => ({ key: String(i), label }));
          const current = at % list.length;
          const hit = rowStartingWith(list, current, char);
          return hit === null || fold(list[hit]!.label).startsWith(fold(char));
        },
      ),
    );
  });

  it('holds one tab stop: the row focused last, else the current page, else the first', () => {
    expect(tabbableRow(rows, 'collections:pages', 'group:blog')).toBe('group:blog');
    expect(tabbableRow(rows, 'collections:pages', 'gone')).toBe('collections:pages');
    expect(tabbableRow(rows, null, null)).toBe('dashboard');
    expect(tabbableRow([], null, null)).toBeNull();
  });

  it('lists the rows in document order (a section placed first before the entries, one placed last after them), a closed group without its entries', () => {
    expect(treeRows(groups, () => true, 'Dashboard').map((r) => r.key)).toEqual([
      'dashboard',
      'group:site',
      'collections:messages',
      'globals:home',
      'collections:pages',
      'group:blog',
      'collections:posts',
      'collections:authors',
      'collections:ai-runs',
    ]);
    expect(groupBlocks(groups[0]!).map((b) => b.kind)).toEqual(['section', 'entity', 'entity']);
    expect(groupBlocks(groups[1]!).map((b) => b.kind)).toEqual(['entity', 'section']);
    expect(groupEntities(groups[0]!).map((e) => e.slug)).toEqual(['messages', 'home', 'pages']);
    expect(treeRows(groups, (key) => key === 'blog', 'Dashboard').map((r) => r.label)).toEqual([
      'Dashboard',
      'Site',
      'Blog',
      'Posts',
      'Authors',
      'Runs',
    ]);
    expect(rowKey.entity('views', 'traffic')).toBe('views:traffic');
  });
});

describe('the current page and the open groups', () => {
  it('matches a route and its sub-routes, never a longer sibling', () => {
    expect(isActive('/admin/collections/pages', '/admin/collections/pages')).toBe(true);
    expect(isActive('/admin/collections/pages/3', '/admin/collections/pages')).toBe(true);
    expect(isActive('/admin/collections/pages-old', '/admin/collections/pages')).toBe(false);
    expect(isDashboard('/admin', '/admin')).toBe(true);
    expect(isDashboard('/admin/', '/admin')).toBe(true);
    expect(isDashboard('/admin/collections/pages', '/admin')).toBe(false);
  });

  it('names the active row and its group; the dashboard on the admin route alone', () => {
    expect(activeRowKey(groups, '/admin', '/admin')).toBe('dashboard');
    expect(activeRowKey(groups, '/admin/collections/messages/4', '/admin')).toBe(
      'collections:messages',
    );
    expect(activeGroupKey(groups, '/admin/collections/messages')).toBe('site');
    expect(activeRowKey(groups, '/admin/collections/authors/2', '/admin')).toBe(
      'collections:authors',
    );
    expect(activeRowKey(groups, '/admin/collections/ai-runs', '/admin')).toBe(
      'collections:ai-runs',
    );
    expect(activeRowKey(groups, '/admin/account', '/admin')).toBeNull();
    expect(activeGroupKey(groups, '/admin/collections/ai-runs')).toBe('blog');
    expect(activeGroupKey(groups, '/admin')).toBeNull();
  });

  it('opens a group unless closed, forces the active one open, and lets a click on this page win', () => {
    expect(groupIsOpen(undefined, false, '/a')).toBe(true);
    expect(groupIsOpen({ open: false }, false, '/a')).toBe(false);
    expect(groupIsOpen({ open: false }, true, '/a')).toBe(true);
    expect(groupIsOpen({ open: false, toggledAt: '/a' }, true, '/a')).toBe(false);
    expect(groupIsOpen({ open: false, toggledAt: '/b' }, true, '/a')).toBe(true);
    expect(groupIsOpen({ open: true, toggledAt: '/a' }, false, '/a')).toBe(true);
  });
});

describe('the badge rule: a number only where it asks for action', () => {
  it('shows a positive count in its kind’s tone and nothing for zero', () => {
    expect(badgeFor('failedRuns', 3)).toEqual({ kind: 'failedRuns', count: 3, tone: 'error' });
    expect(badgeFor('drafts', 1)).toEqual({ kind: 'drafts', count: 1, tone: 'warning' });
    expect(badgeFor('overLimit', 2)).toEqual({ kind: 'overLimit', count: 2, tone: 'error' });
    expect(badgeFor('inbox', 4)).toEqual({ kind: 'inbox', count: 4, tone: 'error' });
    for (const n of [0, -1, 1.5, Number.NaN])
      expect(badgeFor('drafts', n), String(n)).toBeUndefined();
    expect(BADGE_TONE).toEqual({
      failedRuns: 'error',
      drafts: 'warning',
      overLimit: 'error',
      inbox: 'error',
    });
    expect(BADGE_ENTRY).toEqual({
      failedRuns: 'ai-runs',
      drafts: 'posts',
      overLimit: 'connections',
      inbox: 'messages',
    });
  });

  it('never grey: every tone is red or amber', () => {
    for (const tone of Object.values(BADGE_TONE)) expect(['error', 'warning']).toContain(tone);
  });

  it('says what the dashboard says, in both languages, declined by the count', () => {
    for (const strings of [adminStrings, adminStringsAr]) {
      const sentences = badgeStrings(strings);
      for (const kind of Object.keys(BADGE_TONE) as Array<keyof typeof BADGE_TONE>) {
        for (const n of [1, 2, 3, 11]) expect(sentences[kind](n)).toMatch(/\S/);
      }
      expect(sentences.failedRuns).toBe(strings.dashboard.hand.failedRuns);
      expect(sentences.drafts).toBe(strings.dashboard.tiles.drafts);
      expect(sentences.inbox).toBe(strings.dashboard.inbox.newMessages);
    }
    const en = badgeStrings(adminStrings);
    const ar = badgeStrings(adminStringsAr);
    expect(en.drafts(1)).toBe('1 draft waiting');
    expect(en.failedRuns(3)).toBe('3 failed runs this week');
    expect(ar.drafts(2)).toBe('مسودتان بانتظارك');
    expect(ar.failedRuns(1)).toBe('جولة فاشلة واحدة هذا الأسبوع');
    expect(ar.overLimit(11)).toBe('11 اتصالاً تجاوز حدّه الشهري');
    expect(en.inbox(1)).toBe('1 new message');
    expect(en.inbox(3)).toBe('3 new messages');
    expect(ar.inbox(1)).toBe('رسالة جديدة واحدة');
    expect(ar.inbox(2)).toBe('رسالتان جديدتان');
    expect(ar.inbox(3)).toBe('3 رسائل جديدة');
    expect(ar.inbox(11)).toBe('11 رسالة جديدة');
    expect(en.inbox(0)).toBe('No new messages');
    expect(ar.inbox(0)).toBe('لا رسائل جديدة');
  });

  it('reads the dashboard readers for the entries the user sees, and survives a failed read', async () => {
    const asked: string[] = [];
    const now = new Date('2026-09-18T09:00:00Z');
    const payload = {
      count: async (args: { collection: string; where: unknown }) => {
        asked.push(`count:${args.collection}`);
        if (args.collection === 'ai-runs') {
          expect(args.where).toEqual({
            and: [
              { status: { equals: 'failed' } },
              { startedAt: { greater_than_equal: '2026-09-11T09:00:00.000Z' } },
            ],
          });
          throw new Error('boom');
        }
        return { totalDocs: 0 };
      },
      countVersions: async (args: { collection: string; where: { and: unknown[] } }) => {
        asked.push(`versions:${args.collection}`);
        expect(args.where.and.slice(0, 2)).toEqual([
          { latest: { equals: true } },
          { 'version._status': { equals: 'draft' } },
        ]);
        return { totalDocs: args.where.and.length === 2 ? 2 : 1 };
      },
      find: async (args: { collection: string; where: unknown }) => {
        asked.push(`find:${args.collection}`);
        if (args.collection === 'messages') {
          expect(args.where).toEqual({ status: { equals: 'new' } });
          return { docs: [{ id: 9 }], totalDocs: 5 };
        }
        return { docs: [] };
      },
      logger: { error: () => {} },
    } as unknown as Payload;
    const badges = await navBadges({
      payload,
      user: undefined,
      visible: new Set(['posts', 'ai-runs', 'pages', 'messages']),
      now,
    });
    expect(badges).toEqual({
      posts: { kind: 'drafts', count: 2, tone: 'warning' },
      messages: { kind: 'inbox', count: 5, tone: 'error' },
    });
    expect(asked.toSorted()).toEqual([
      'count:ai-runs',
      'find:messages',
      'versions:posts',
      'versions:posts',
    ]);
  });

  it('counts the enabled connections whose month has reached the limit, in two queries', async () => {
    const calls: Array<{ collection: string }> = [];
    const payload = {
      find: async (args: { collection: string }) => {
        calls.push(args);
        if (args.collection === 'connections') {
          return {
            docs: [
              { id: 1, monthlyLimitUsd: 10, enabled: true },
              { id: 2, monthlyLimitUsd: 5, enabled: true },
              { id: 3, monthlyLimitUsd: 1, enabled: false },
            ],
          };
        }
        return {
          docs: [
            { connection: 1, costUsd: 4 },
            { connection: 1, costUsd: 6 },
            { connection: 2, costUsd: 4.99 },
            { connection: 3, costUsd: 50 },
          ],
        };
      },
    } as unknown as Payload;
    expect(await overLimitConnections(payload, new Date('2026-09-14T22:30:00Z'))).toBe(1);
    expect(calls.map((c) => c.collection)).toEqual(['connections', 'ai-runs']);
    expect(calls[1]).toMatchObject({
      where: {
        and: [
          { connection: { in: [1, 2] } },
          { startedAt: { greater_than_equal: '2026-08-31T21:00:00.000Z' } },
          { status: { not_equals: 'skipped' } },
        ],
      },
    });
    const none = { find: async () => ({ docs: [] }) } as unknown as Payload;
    expect(await overLimitConnections(none)).toBe(0);
  });
});
