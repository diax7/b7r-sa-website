import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LegalPage } from '@/content/schema';

/** BRD Appendix B, read verbatim from `content/legal/*.md` at build time (server only). */
const meta: Array<Pick<LegalPage, 'slug' | 'title' | 'updatedAt'>> = [
  { slug: 'terms', title: 'الشروط والأحكام', updatedAt: '2026-09-12' },
  { slug: 'shipping', title: 'الشحن والتوصيل', updatedAt: '2026-09-12' },
  { slug: 'privacy', title: 'سياسة الخصوصية', updatedAt: '2026-09-12' },
];

export function getLegalPages(): LegalPage[] {
  return meta.map((m) => ({
    ...m,
    body: readFileSync(join(process.cwd(), 'src', 'content', 'legal', `${m.slug}.md`), 'utf8'),
  }));
}
