/**
 * Register links to the app (BRD §4.3, §4.4; there is no login link on the site, ADR-044).
 * Every CTA carries `utm_source=b7r.sa&utm_medium=website&utm_campaign=<campaign>` plus
 * optional content.
 */
export interface RegisterUrlOptions {
  campaign: 'header' | 'hero' | 'designer' | 'video' | 'ribbon' | 'product' | 'menu';
  content?: string;
  product?: string;
}

export function registerUrl(
  appUrl: string,
  { campaign, content, product }: RegisterUrlOptions,
): string {
  const url = new URL('/register', appUrl);
  url.searchParams.set('utm_source', 'b7r.sa');
  url.searchParams.set('utm_medium', 'website');
  url.searchParams.set('utm_campaign', campaign);
  if (content) url.searchParams.set('utm_content', content);
  if (product) url.searchParams.set('product', product);
  return url.toString();
}

/** wa.me link; the text is percent-encoded (WhatsApp expects %20, not +, for spaces). */
export function whatsappUrl(number: string, message?: string): string {
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
