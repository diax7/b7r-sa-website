import { feedResponse } from '@/modules/blog';

/** Regenerated on publish (`revalidatePath`) and at most once a minute. */
export const revalidate = 60;

/** RSS 2.0, the latest 20 Arabic posts with their full text (BRD 10.1). */
export function GET(): Promise<Response> {
  return feedResponse('ar');
}
