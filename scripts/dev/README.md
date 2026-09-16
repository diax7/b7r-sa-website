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
