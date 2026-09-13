import { test } from '@playwright/test';

test('debug admin api', async ({ request }) => {
  const res = await request.post('/api/payload/users/login', {
    data: { email: process.env['ADMIN_EMAIL'], password: process.env['ADMIN_PASSWORD'] },
  });
  const body = (await res.json()) as { token?: string };
  console.log('login', res.status(), 'token?', Boolean(body.token), body.token?.slice(0, 20));
  const headers = { Authorization: `JWT ${body.token}` };
  const me = await request.get('/api/payload/users/me', { headers });
  console.log('me', me.status(), (await me.text()).slice(0, 120));
  const patch = await request.patch('/api/payload/products/1', {
    headers,
    data: { material: 'قطن 100%', _status: 'published' },
  });
  console.log('patch', patch.status(), (await patch.text()).slice(0, 200));
});
