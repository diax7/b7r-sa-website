'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import type { UIFieldClientProps } from 'payload';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/shared/icon';
import { entityHue, type Hue, SECTION_ICONS, type SectionIconKey } from '@/modules/cms/admin/icons';

/**
 * One icon per tab of the tabs field before this one (ADR-060). Payload 3.89 has no slot
 * for a tab's label (a tab's `admin` carries `condition` and `description` only) and never
 * renders a custom `Field` on a `tabs` field (`addFieldStatePromise` returns before
 * `renderFieldFn` for that type), so `describeFields()` places this `ui` field right after
 * every tabs field with the tabs' icon keys in `admin.custom.icons`, and this is the one
 * file that reaches into Payload's DOM. It relies on three facts of `@payloadcms/ui` 3.89,
 * read in `dist/fields/Tabs`:
 *
 * 1. every tab renders a `button.tabs-field__tab-button` in config order, and a tab whose
 *    condition fails stays in the DOM with `--hidden` (`Tabs/index.js`, `Tab/index.scss`), so
 *    `buttons[i]` is `tabs[i]`: the mapping is by index, never by text;
 * 2. the button is a flex row with a gap (`Tab/index.scss`), so a span given `order: -1`
 *    sits before the label in both directions (`admin.css`);
 * 3. a portal appends its node to the button and React leaves it alone when the label or
 *    the error pill re-render.
 *
 * The icons mount after Payload's render (a layout effect keyed on the tab count), one
 * portal per button keyed by its index (React re-renders the same node, never a second),
 * and when the tabs field is not the previous sibling, or its buttons are not as many as
 * the tabs, nothing mounts: the degraded state is Payload's own tab, never a thrown error
 * in the edit view. The span also carries the document's group hue, which `admin.css` reads
 * through `:has()` to colour the active tab's bar (one of the screen's two hue carriers).
 * The e2e asserts buttons = tabs on the configs with a conditional tab, so a Payload
 * release that drops hidden buttons fails a test, not a screen. When Payload ships a tab
 * `Label` slot, this file is deleted and `describeFields()` stops placing the field.
 */
export function IconTabs(props: UIFieldClientProps) {
  const marker = useRef<HTMLSpanElement>(null);
  const [buttons, setButtons] = useState<HTMLElement[]>([]);
  const { collectionSlug, globalSlug } = useDocumentInfo();
  const hue: Hue = collectionSlug
    ? entityHue('collections', collectionSlug)
    : globalSlug
      ? entityHue('globals', globalSlug)
      : 'blue';
  const icons = iconKeys(props.field.admin?.custom?.['icons']);
  const count = icons.length;
  useLayoutEffect(() => {
    const root = marker.current?.previousElementSibling;
    if (!(root instanceof HTMLElement) || !root.classList.contains('tabs-field')) {
      setButtons([]);
      return;
    }
    const found = [
      ...root.querySelectorAll<HTMLElement>(
        ':scope > .tabs-field__tabs-wrap > .tabs-field__tabs > .tabs-field__tab-button',
      ),
    ];
    setButtons(found.length === count ? found : []);
  }, [count]);
  return (
    <>
      <span ref={marker} hidden data-admin-icon-tabs={count} />
      {buttons.map((button, index) => {
        const key = icons[index];
        const TabIcon = key ? SECTION_ICONS[key] : undefined;
        if (!TabIcon) return null;
        return createPortal(
          <span
            className="inline-flex shrink-0 items-center"
            data-admin-section-icon={key}
            data-admin-section-hue={hue}
          >
            <Icon icon={TabIcon} size={16} />
          </span>,
          button,
          String(index),
        );
      })}
    </>
  );
}

/** The keys as the config wrote them, one per tab; anything else reads as no icon. */
function iconKeys(value: unknown): Array<SectionIconKey | null> {
  if (!Array.isArray(value)) return [];
  return value.map((key: unknown) =>
    typeof key === 'string' && key in SECTION_ICONS ? (key as SectionIconKey) : null,
  );
}
