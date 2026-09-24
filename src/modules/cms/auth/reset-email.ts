import type { PayloadRequest } from 'payload';
import type { MailPalette } from '@/lib/mail-palette';
import { mailPalette, toAppearance } from '@/modules/brand/appearance';
import { readMailPalette } from '@/modules/brand/mail';

/**
 * The password-reset e-mail (BRD 9.3): English like the panel it opens, one link. Payload
 * calls these from its forgot-password operation; the adapter that sends them is Resend when
 * `RESEND_API_KEY` is set (ADR-034), else the console.
 */
export const RESET_SUBJECT = 'Reset your password: B7R Print Admin';

const escape = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

/** The reset link on the admin, on the configured server URL (never the request's Host). */
export function resetUrl(serverUrl: string, token: string): string {
  return `${serverUrl.replace(/\/$/, '')}/admin/reset/${encodeURIComponent(token)}`;
}

/**
 * The mail in the brand's colours at send time (spec 010): the text, the page behind the
 * card, the button and the small print.
 */
export function resetEmailHtml(args: {
  url: string;
  name?: string | undefined;
  palette: MailPalette;
}): string {
  const { palette } = args;
  const greeting = args.name ? `Hello ${escape(args.name)},` : 'Hello,';
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:${palette.text};background:${palette.ground}">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:13px;padding:32px">
<h1 style="font-size:20px;margin:0 0 16px">Reset your password</h1>
<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 20px">We received a request to reset the password of your B7R Print Admin account. The link works for one hour.</p>
<p style="margin:0 0 24px"><a href="${escape(args.url)}" style="display:inline-block;background:${palette.primary};color:#fff;text-decoration:none;padding:12px 20px;border-radius:13px;font-weight:700">Reset password</a></p>
<p style="margin:0;font-size:13px;color:${palette.muted}">If you did not ask for this, ignore this message; your password will not change.</p>
</div></body></html>`;
}

export function generateResetSubject(): string {
  return RESET_SUBJECT;
}

export async function generateResetHtml(args?: {
  req?: PayloadRequest;
  token?: string;
  user?: { name?: string | null };
}): Promise<string> {
  const serverUrl = args?.req?.payload.config.serverURL ?? '';
  const palette = args?.req
    ? await readMailPalette(args.req.payload)
    : mailPalette(toAppearance(null).appearance);
  return resetEmailHtml({
    url: resetUrl(serverUrl, args?.token ?? ''),
    name: args?.user?.name ?? undefined,
    palette,
  });
}
