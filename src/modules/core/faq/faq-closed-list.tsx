import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { Icon } from '@/components/shared/icon';
import {
  ACCORDION_CHEVRON,
  ACCORDION_HEADING,
  ACCORDION_ITEM,
  ACCORDION_PANEL,
  ACCORDION_PANEL_BODY,
  ACCORDION_PANEL_CLIP,
  ACCORDION_PANEL_GRID,
  ACCORDION_ROOT,
  ACCORDION_TRIGGER,
} from '@/components/ui/accordion-styles';

interface FaqClosedListProps {
  items: Array<{ question: string; answer: string }>;
}

/**
 * The FAQ rows as the server renders them: the same boxes and classes as the Radix
 * accordion in its closed state (every answer in the DOM for crawlers, hidden from view),
 * shown until `FaqAccordionLoader` mounts the island near the viewport, or the moment a Tab
 * or a finger reaches a row (`NearViewport`). The buttons are `aria-disabled` until then: they
 * can take focus, which is what mounts the island and carries the focus over, and nothing
 * lands on a control that looks live and is not. Same height before and after, so the swap
 * moves nothing.
 */
export function FaqClosedList({ items }: FaqClosedListProps) {
  const id = useId();
  return (
    <div className={ACCORDION_ROOT}>
      {items.map((item, index) => (
        <div key={item.question} data-state="closed" className={ACCORDION_ITEM}>
          <h3 className={ACCORDION_HEADING}>
            <button
              type="button"
              id={`${id}-q${index}`}
              aria-disabled="true"
              aria-expanded="false"
              data-state="closed"
              className={ACCORDION_TRIGGER}
            >
              {item.question}
              <Icon icon={ChevronDown} size={20} className={ACCORDION_CHEVRON} />
            </button>
          </h3>
          <div
            role="region"
            aria-labelledby={`${id}-q${index}`}
            data-state="closed"
            className={ACCORDION_PANEL}
          >
            <div className={ACCORDION_PANEL_GRID}>
              <div className={ACCORDION_PANEL_CLIP}>
                <div className={ACCORDION_PANEL_BODY}>{item.answer}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
