import { randomBytes } from 'node:crypto';
import { expect, type APIRequestContext } from '@playwright/test';

/** Shared seats for the CMS suites: the REST prefix, JWT login and a throwaway editor. */
export const API = '/api/payload';

export const ADMIN = {
  email: process.env['ADMIN_EMAIL'] ?? '',
  password: process.env['ADMIN_PASSWORD'] ?? '',
};

export const hasAdmin = Boolean(process.env['ADMIN_EMAIL'] && process.env['ADMIN_PASSWORD']);

export async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
) {
  const res = await request.post(`${API}/users/login`, { data: credentials });
  expect(res.status(), 'login').toBe(200);
  const { token } = (await res.json()) as { token: string };
  return { Authorization: `JWT ${token}` };
}

/** Creates an editor with the admin's token; the caller removes it in `finally`. */
export async function createEditor(request: APIRequestContext, adminAuth: Record<string, string>) {
  const editor = {
    email: `e2e-editor-${randomBytes(4).toString('hex')}@b7r.sa`,
    password: randomBytes(18).toString('base64url'),
  };
  const created = await request.post(`${API}/users`, {
    headers: adminAuth,
    data: { ...editor, name: 'محرر الاختبار', role: 'editor' },
  });
  expect(created.status()).toBe(201);
  const id = ((await created.json()) as { doc: { id: number } }).doc.id;
  return { ...editor, id };
}

/** Polling steps for "live at once" assertions (ADR-030): the hook fires, the timer is the floor. */
export const POLL = { intervals: [1_000, 2_000, 3_000], timeout: 15_000 };

export const shows = (request: APIRequestContext, path: string, text: string) => async () =>
  (await (await request.get(path)).text()).includes(text);

/** The mock connection (ADR-047): the one there is, or a new one; the engine tests run on it. */
export async function mockConnectionId(
  request: APIRequestContext,
  auth: Record<string, string>,
): Promise<number> {
  const found = (await (
    await request.get(`${API}/connections?where[kind][equals]=mock&limit=1&depth=0`, {
      headers: auth,
    })
  ).json()) as { docs: Array<{ id: number }> };
  if (found.docs[0]) return found.docs[0].id;
  const made = await request.post(`${API}/connections`, {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: { label: 'Mock', kind: 'mock' },
  });
  if (made.status() !== 201) throw new Error(`connections answered ${made.status()}`);
  return ((await made.json()) as { doc: { id: number } }).doc.id;
}
