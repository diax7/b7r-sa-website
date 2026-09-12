/**
 * Register / login links to the app (BRD §4.3, §4.4). Every CTA carries
 * `utm_source=b7r.sa&utm_medium=website&utm_campaign=<campaign>` plus optional content.
 */
export interface RegisterUrlOptions {
  campaign: 'header' | 'hero' | 'designer' | 'ribbon' | 'product' | 'menu';
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

export function loginUrl(appUrl: string): string {
  return new URL('/login', appUrl).toString();
}

export function whatsappUrl(number: string, message?: string): string {
  const url = new URL(`https://wa.me/${number}`);
  if (message) url.searchParams.set('text', message);
  return url.toString();
}
