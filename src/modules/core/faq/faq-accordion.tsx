'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { track } from '@/modules/core/analytics/track';

interface FaqAccordionProps {
  items: Array<{ question: string; answer: string }>;
}

/**
 * Single-open accordion for the FAQ items, rendered closed on the server with every answer in
 * the DOM (`AccordionContent` mounts its panel); tracks `faq_open{question}` (BRD 6.4.9).
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="border-t border-border"
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
