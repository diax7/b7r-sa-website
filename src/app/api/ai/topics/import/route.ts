import { adminOnly, jsonBody, parseTopicsCsv } from '@/modules/ai-content';

/** A pasted spreadsheet is created row by row in the request: a generous bound for a backlog. */
const MAX_ROWS = 200;

/**
 * Bulk add topics from CSV (BRD 10.2.7): `{ csv: string }`; hubs by slug; a title already in
 * the backlog is skipped; at most 200 rows per import. Admins only.
 */
export async function POST(req: Request): Promise<Response> {
  const guard = await adminOnly(req);
  if (!guard.ok) return guard.response;
  const body = (await jsonBody(req)) ?? {};
  const csv = typeof body['csv'] === 'string' ? body['csv'] : '';
  if (!csv.trim()) return Response.json({ error: 'csv required' }, { status: 400 });
  const { rows, errors } = parseTopicsCsv(csv);
  if (rows.length > MAX_ROWS) {
    return Response.json(
      { error: `${rows.length} rows; at most ${MAX_ROWS} per import` },
      { status: 400 },
    );
  }
  const { payload } = guard;
  const hubs = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 50,
    pagination: false,
    overrideAccess: true,
  });
  const hubId = new Map(hubs.docs.map((h) => [h.slug, h.id]));
  const created: string[] = [];
  const skipped: string[] = [];
  for (const row of rows) {
    const hub = hubId.get(row.hub);
    if (!hub) {
      errors.push(`"${row.title}": unknown hub "${row.hub}"`);
      continue;
    }
    // Rows are created one by one so a duplicate inside the same CSV is skipped too.
    // oxlint-disable-next-line no-await-in-loop
    const existing = await payload.count({
      collection: 'ai-topics',
      where: { title: { equals: row.title } },
      overrideAccess: true,
    });
    if (existing.totalDocs > 0) {
      skipped.push(row.title);
      continue;
    }
    // oxlint-disable-next-line no-await-in-loop
    await payload.create({
      collection: 'ai-topics',
      data: {
        title: row.title,
        hub,
        primaryKeyword: row.primaryKeyword,
        secondaryKeywords: row.secondaryKeywords.map((keyword) => ({ keyword })),
        intent: row.intent,
        priority: row.priority,
        status: 'backlog',
        source: 'manual',
      },
      depth: 0,
      overrideAccess: true,
    });
    created.push(row.title);
  }
  return Response.json({ created, skipped, errors });
}
