import { describe, expect, it } from 'vitest';
import { clientIp, createRateLimiter } from '@/lib/rate-limit';

describe('rate limiter (BRD 6.14: 5 per 10 minutes per IP)', () => {
  it('allows the first five hits and blocks the sixth within the window', () => {
    const rl = createRateLimiter(5, 10 * 60_000);
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rl.hit('a', t0 + i).allowed).toBe(true);
    const sixth = rl.hit('a', t0 + 5);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterMs).toBeGreaterThan(0);
  });

  it('keys are independent', () => {
    const rl = createRateLimiter(1, 1000);
    expect(rl.hit('a', 0).allowed).toBe(true);
    expect(rl.hit('b', 0).allowed).toBe(true);
    expect(rl.hit('a', 1).allowed).toBe(false);
  });

  it('slides: hits older than the window no longer count', () => {
    const rl = createRateLimiter(2, 1000);
    expect(rl.hit('a', 0).allowed).toBe(true);
    expect(rl.hit('a', 500).allowed).toBe(true);
    expect(rl.hit('a', 900).allowed).toBe(false);
    expect(rl.hit('a', 1001).allowed).toBe(true);
  });

  it('reports remaining budget', () => {
    const rl = createRateLimiter(3, 1000);
    expect(rl.hit('a', 0).remaining).toBe(2);
    expect(rl.hit('a', 1).remaining).toBe(1);
    expect(rl.hit('a', 2).remaining).toBe(0);
  });
});

describe('clientIp', () => {
  it('uses the last x-forwarded-for entry (appended by the trusted proxy)', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.9' }))).toBe('10.0.0.9');
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7');
  });
  it('falls back to x-real-ip then unknown', () => {
    expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(clientIp(new Headers())).toBe('unknown');
  });
});
