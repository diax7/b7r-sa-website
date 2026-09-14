// The engine on the review server (ADR-042): `node scripts/dev/engine-demo.mjs run 5` queues
// five mock runs against the seeded backlog and waits for them (the daily cap allows five at
// most: ten posts take two days); `... clean` deletes every engine post, run and the topics'
// links, so the public e2e (which assumes the seed) passes again. Reads ADMIN_EMAIL /
// ADMIN_PASSWORD from .env.local; the server must be up on :3004.
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3004';
const API = `${BASE}/api/payload`;
const [, , command = 'run', countArg = '5'] = process.argv;
/** `postsPerDay` tops out at 5 in the settings (BRD 10.2.1). */
const DAY_MAX = 5;

const env = Object.fromEntries(
  fs
    .readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^"|"$/g, ''),
      ];
    }),
);

const login = await fetch(`${API}/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }),
});
if (!login.ok) throw new Error(`login answered ${login.status}`);
const { token } = await login.json();
const H = { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' };

const get = async (path) => (await fetch(`${API}${path}`, { headers: H })).json();
const post = (path, data) =>
  fetch(`${API}${path}`, { method: 'POST', headers: H, body: JSON.stringify(data) });
const del = (path) => fetch(`${API}${path}`, { method: 'DELETE', headers: H });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(count) {
  if (count > DAY_MAX) {
    console.log(`${count} asked; the daily cap allows ${DAY_MAX}: running ${DAY_MAX}`);
    count = DAY_MAX;
  }
  const before = await get('/globals/ai-settings');
  const set = await post('/globals/ai-settings', {
    activeProvider: 'mock',
    enabled: true,
    postsPerDay: count,
  });
  if (!set.ok) throw new Error(`settings answered ${set.status}: ${await set.text()}`);
  try {
    let lastSeen = (await get('/ai-runs?sort=-createdAt&limit=1')).docs[0]?.id ?? 0;
    for (let i = 0; i < count; i++) {
      const res = await fetch(`${BASE}/api/ai/generate`, {
        method: 'POST',
        headers: H,
        body: JSON.stringify({}),
      });
      if (res.status !== 202)
        throw new Error(`generate answered ${res.status}: ${await res.text()}`);
      // One job at a time on the `ai` queue, picked up once a minute: wait for a new run row
      // to appear and finish before queueing the next.
      let latest = null;
      for (let t = 0; t < 120; t++) {
        await sleep(5_000);
        const runs = await get('/ai-runs?sort=-createdAt&limit=1');
        latest = runs.docs[0];
        if (latest && latest.id !== lastSeen && latest.status !== 'running') break;
      }
      lastSeen = latest?.id ?? lastSeen;
      const postDoc = latest?.post
        ? await get(
            `/posts/${typeof latest.post === 'object' ? latest.post.id : latest.post}?depth=0`,
          )
        : null;
      console.log(
        `${i + 1}/${count}: run ${latest?.id} ${latest?.status} score ${latest?.score ?? '-'} ${postDoc ? `/blog/${postDoc.slug}` : (latest?.error ?? '')}`,
      );
      if (latest?.status === 'skipped') break;
    }
  } finally {
    await post('/globals/ai-settings', { postsPerDay: before.postsPerDay ?? 1 });
  }
}

async function clean() {
  const topics = await get('/ai-topics?limit=200&depth=0&where[post][exists]=true');
  const seededPosts = new Set([
    'start-clothing-brand-saudi-no-factory-no-stock',
    'what-is-print-on-demand-saudi-examples',
    'how-to-price-printed-tshirt-saudi',
  ]);
  let posts = 0;
  for (const topic of topics.docs) {
    const doc = await get(`/posts/${topic.post}?depth=0`);
    if (doc?.slug && !seededPosts.has(doc.slug)) {
      await del(`/posts/${topic.post}`);
      await fetch(`${API}/ai-topics/${topic.id}`, {
        method: 'PATCH',
        headers: H,
        body: JSON.stringify({ status: 'backlog', post: null, lastRun: null, lastError: null }),
      });
      posts += 1;
    }
  }
  const runs = await get('/ai-runs?limit=500&depth=0');
  for (const r of runs.docs) await del(`/ai-runs/${r.id}`);
  console.log(
    `deleted ${posts} engine post(s) and ${runs.docs.length} run(s); topics back in the backlog`,
  );
}

if (command === 'clean') await clean();
else await run(Number(countArg));
