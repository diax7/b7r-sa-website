# Ideas parked outside the current phase

Constitution VIII: features outside the current phase are written here, not built.

- Docker image is 307 MB after 1c (292 MB after 1a) vs the BRD 8.6 target of 250 MB; the app layer is ~60 MB and the rest is `node:22-alpine`. Evaluate a distroless/slim base or pruned locales before the CranL deploy. The 1c image was smoke-tested: health, 301, 410, CSP/Content-Language headers, OG assets, and the `B7R_RUNTIME=production` gate exits 1 with the missing-variable list.
- Simulated LCP on `/` stays at 3.4 s vs the 2.5 s LHCI assertion after the 1b time box (ADR-014); the floor is the React runtime. Options for later: React Compiler / smaller runtime when available, or renegotiate the assertion with Dhia against the DevTools-throttled 2.1 s.
- JS on `/` after 1b: 176 kB of 180 kB with every widget configured (all islands lazy). Anything new on the home page must be lazy.
- Level 2 CMS Markdown must be sanitised (e.g. `rehype-sanitize` or DOMPurify on the server) before it reaches `Prose`'s `dangerouslySetInnerHTML`; today `lib/markdown.ts` renders trusted repo files only.
- `/contact` ships ~58 kB more JS than the home baseline (Radix Select, form, Turnstile hook). A native `<select>` restyled to the tokens would cut most of it if BRD 3.10's Radix mandate is ever relaxed.
- Home JS budget test aborts route prefetches (`Next-Router-Prefetch`) so it measures the home route alone; the prefetched chunks for header/footer links are real bandwidth on 4G and worth a look if the BRD ever budgets navigation.
- Lighthouse variance on the simulated mobile run is ±3 points around the 0.9 threshold for `/` and the product pages (ADR-014 floor); `scripts/dev/lh-all.sh` warms the `next/image` cache first because the cold first transform alone costs a point.
- One transient e2e failure seen on a cold server (first run after `restart.sh`): `products.spec.ts › mobile sticky bar appears after the CTA scrolls out` on iphone-15 (`toHaveAttribute aria-hidden`), not reproduced on three later cold runs. If it recurs, wait for hydration of `[data-product-sticky]` before scrolling instead of relying on `retries: 1`.
