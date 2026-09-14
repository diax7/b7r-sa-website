import { llmsResponse } from '@/modules/core/seo/llms-route';

/** Regenerated on publish (`revalidatePath`) and at most once a minute. */
export const revalidate = 60;

/** The Arabic `llms.txt` (BRD 7.10, ADR-043). */
export function GET(): Promise<Response> {
  return llmsResponse('ar');
}
