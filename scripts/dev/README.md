# Local dev helpers (not part of the gates)

- `restart.sh`, rebuild and restart the production server on :3004 (kills the old process by port).
- `lh.sh [out.json]`, build with the production origin, serve, run one mobile Lighthouse, print scores.
- `shot.mjs <url> <out.png> [desktop|mobile] [full|view]`, screenshot.
- `clip.mjs <url> <out.png> <selector> [scale]`, screenshot one element.
- `hover.mjs <url> <out.png> <hoverSelector> <shotSelector>`, rest + hover screenshots.
- `designer-shot.mjs <url> <out.png> [desktop|mobile]`, screenshot the designer after it hydrates.
- `menu.mjs <url> <out.png>`, screenshot the open mobile menu.
