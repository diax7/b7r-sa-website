# Local dev helpers (not part of the gates)

- `restart.sh`, rebuild and restart the production server on :3004 (kills the old process by port).
- `lh.sh [out.json]`, build with the production origin, serve, run one mobile Lighthouse, print scores.
- `shot.mjs <url> <out.png> [desktop|mobile] [full|view]`, screenshot.
- `clip.mjs <url> <out.png> <selector> [scale]`, screenshot one element.
- `hero-shots.mjs <out dir> [file.css]`, the hero at 1920, 2560 and 3440 px (Arabic and English) with an optional stylesheet injected, plus the hero's box and the fetched image width on stdout (the ADR-051 study).
- `hover.mjs <url> <out.png> <hoverSelector> <shotSelector>`, rest + hover screenshots.
- `designer-shot.mjs <url> <out.png> [desktop|mobile]`, screenshot the designer after it hydrates.
- `menu.mjs <url> <out.png>`, screenshot the open mobile menu.
- `engine-demo.mjs run [n] [en]`, n mock posts (English topics with `en`) (five a day at most, the cap) from the seeded backlog on the review server; `engine-demo.mjs clean` removes every engine post and run (the public e2e assumes the seed).
- `golden.mjs snap|diff`, HTML snapshots of the five Lighthouse URLs before a refactor and the first differing line after it (Level 5's copy refactor guard).

Local Playwright runs use four workers (`playwright.config.ts`): eight starved the emulated
WebKit projects (taps landed late, a stepper click was lost) and the interaction tests flaked.
CI keeps Playwright's default. Do not raise the cap to save a minute.
- `island-shots.mjs <out dir>`, the header at rest and scrolled on desktop and iPhone (ADR-053); `cta-shot.mjs <out dir>`, the header CTA at rest and hovered.
- `cta-shiny-toggle.ts on|off`, the header's shiny switch on the local database (ADR-054).
- `analytics-probe.mjs [origin]`, a real browser visits the live site, accepts the consent bar, walks two pages and lists every request to Umami and GA4 with its status (a `connect-src` refusal in the console is the sign Umami moved its gateway again).
- `cranl-smoke.mjs [origin]`, the temporary domain (or `https://b7r.sa` after the cutover) after a deploy: the admin in both languages, the sidebar, the dashboard, a bilingual twin, one publish and one upload through the API, both undone (launch checklist row 39).
- `prelaunch-clean.ts`, before dumping the review database for production: the Mock connection and its citations, the failed jobs, the CI analytics ids. `media-to-bucket.mjs <env file>`, copies `public/media` into the production bucket under `media/`.
- In `scripts/` (not here): `media-blur.ts [--env <file>] [--force]` fills the blur-up placeholder of every media document without one; `media-requality.ts [--env <file>] [--dry-run]` re-uploads the seeded photos at the current encode under new names and deletes the old renditions (RUNBOOK "Assets").
- `shot-studies.mjs <html> <out dir>`, one look at a design-studies page.
