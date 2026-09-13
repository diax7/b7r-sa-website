# Ideas parked outside the current phase

Constitution VIII: features outside the current phase are written here, not built.

- Docker image is 292 MB vs the BRD 8.6 target of 250 MB; the app layer is ~44 MB and the rest is `node:22-alpine`. Evaluate a distroless/slim base or `node:22-alpine` with pruned locales in Phase 1c before the CranL deploy.
- Simulated LCP on `/` stays at 3.4 s vs the 2.5 s LHCI assertion after the 1b time box (ADR-014); the floor is the React runtime. Options for later: React Compiler / smaller runtime when available, or renegotiate the assertion with Dhia against the DevTools-throttled 2.1 s.
- JS on `/` after 1b: 176 kB of 180 kB with every widget configured (all islands lazy). Anything new on the home page must be lazy.
