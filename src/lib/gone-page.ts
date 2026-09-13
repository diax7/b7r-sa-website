import { gonePage } from '@/content/pages';
// The proxy answers before any database call; the seed brand name is the static fallback.
import { site } from '@/content/seed/site';
import { TOKEN_HEX } from '@/lib/tokens';

/**
 * The static 410 body for retired WordPress URLs (BRD 5.2, ADR-017). Served by `src/proxy.ts`
 * without touching the app router, so it carries its own minimal markup: system font, the
 * brand primary for the button, RTL root. `noindex` so engines drop the URL.
 */
export function goneHtml(): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${gonePage.title} | ${site.brandName}</title>
<style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:${TOKEN_HEX.surface};color:${TOKEN_HEX.text};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px}
h1{font-size:28px;margin:0 0 12px}
p{margin:0 0 24px;color:${TOKEN_HEX['text-muted']}}
a{display:inline-block;background:${TOKEN_HEX.primary};color:${TOKEN_HEX.surface};text-decoration:none;padding:12px 24px;border-radius:13px;font-weight:600}
</style>
</head>
<body>
<main>
<h1>${gonePage.title}</h1>
<p>${gonePage.text}</p>
<a href="/">${gonePage.button}</a>
</main>
</body>
</html>
`;
}
