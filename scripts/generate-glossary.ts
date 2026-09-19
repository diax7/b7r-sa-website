import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderGlossary } from '@/modules/cms/admin/glossary';

/**
 * Writes `docs/ADMIN-GLOSSARY.md` from the glossary table (`pnpm glossary`);
 * `tests/admin-glossary.test.ts` fails when the file and the table disagree.
 */
const target = join(process.cwd(), 'docs', 'ADMIN-GLOSSARY.md');
writeFileSync(target, renderGlossary());
console.log(`wrote ${target}`);
