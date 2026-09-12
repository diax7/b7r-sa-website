# Ideas parked outside the current phase

Constitution VIII: features outside the current phase are written here, not built.

- Docker image is 292 MB vs the BRD 8.6 target of 250 MB; the app layer is ~44 MB and the rest is `node:22-alpine`. Evaluate a distroless/slim base or `node:22-alpine` with pruned locales in Phase 1c before the CranL deploy.
- Phase 1b task: simulated LCP on `/` is 3.4–3.6 s vs the 2.5 s LHCI assertion (ADR-010). Lever = less JS before first paint (react-dom + Next runtime are 121 kB of the 172 kB); measure per change with `bash scripts/dev/lh.sh`.
- JS budget headroom on `/` is ~8 kB (172 kB of 180 kB). Phase 1b's WhatsApp widget, consent bar and analytics loader must be lazy or tiny; consider moving the hero carousel logic to a smaller island.
