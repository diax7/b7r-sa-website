import type { UIFieldServerComponent } from 'payload';
import { payloadStore } from '@/modules/ai-content/store/payload-store';
import { adminStrings } from '@/modules/cms/admin/strings';

const s = adminStrings.engine;

/**
 * The facts sheet as the engine sees it (BRD 10.2.1): read-only, built live from the site
 * settings, the products and the integrations. A server component: nothing to edit here.
 */
export const FactsSheetField: UIFieldServerComponent = async ({ payload }) => {
  const store = payloadStore(payload);
  const [facts, factsEn] = await Promise.all([store.facts('ar'), store.facts('en')]);
  return (
    <div className="mb-6 flex flex-col gap-2" data-admin-ui="" data-admin-facts-sheet="">
      <span className="text-small font-medium text-text">{s.factsTitle}</span>
      <span className="text-caption text-text-muted">{s.factsHint}</span>
      {[facts, factsEn].map((sheet, i) => (
        <pre
          key={i === 0 ? 'ar' : 'en'}
          dir="auto"
          lang={i === 0 ? 'ar' : 'en'}
          className="max-h-96 overflow-auto rounded-base border border-border bg-ground p-4 font-sans text-small whitespace-pre-wrap text-text"
        >
          {sheet.text}
        </pre>
      ))}
      <span className="text-caption text-text-muted">
        {s.factsNumbers.replace('{n}', String(facts.numbers.length))}
      </span>
    </div>
  );
};
