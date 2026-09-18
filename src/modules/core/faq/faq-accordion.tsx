'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ACCORDION_ROOT } from '@/components/ui/accordion-styles';
import { track } from '@/modules/core/analytics/track';

interface FaqAccordionProps {
  items: Array<{ question: string; answer: string }>;
}

/**
 * Single-open accordion for the FAQ items; tracks `faq_open{question}` (BRD 6.4.9). Mounted
 * by `FaqAccordionLoader` near the viewport over the closed rows the server rendered
 * (`FaqClosedList`, the same boxes), so the first paint never carries Radix and the swap
 * moves nothing.
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={ACCORDION_ROOT}
      onValueChange={(value) => {
        if (value) track('faq_open', { question: value });
      }}
    >
      {items.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
