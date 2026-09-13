import type { PayloadRequest } from 'payload';

/**
 * The password-reset e-mail (BRD 9.3): Arabic, `dir="rtl"`, one link. Payload calls these
 * from its forgot-password operation; the adapter that sends them is Resend when
 * `RESEND_API_KEY` is set (ADR-034), else the console.
 */
export const RESET_SUBJECT = 'إعادة تعيين كلمة المرور: لوحة بحر برنت';

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

export function resetEmailHtml(args: { url: string; name?: string | undefined }): string {
  const greeting = args.name ? `مرحباً ${escape(args.name)}،` : 'مرحباً،';
  return `<!doctype html>
<html lang="ar" dir="rtl"><body style="margin:0;padding:24px;font-family:Arial,sans-serif;color:#0B1F3A;background:#F5F7FB">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:13px;padding:32px">
<h1 style="font-size:20px;margin:0 0 16px">إعادة تعيين كلمة المرور</h1>
<p style="margin:0 0 12px">${greeting}</p>
<p style="margin:0 0 20px">وصلنا طلب لإعادة تعيين كلمة مرور حسابك في لوحة بحر برنت. الرابط صالح لساعة واحدة.</p>
<p style="margin:0 0 24px"><a href="${escape(args.url)}" style="display:inline-block;background:#0058B0;color:#fff;text-decoration:none;padding:12px 20px;border-radius:13px;font-weight:700">إعادة تعيين كلمة المرور</a></p>
<p style="margin:0;font-size:13px;color:#5B6B82">إن لم تطلب ذلك فتجاهل هذه الرسالة؛ كلمة مرورك لن تتغيّر.</p>
</div></body></html>`;
}

export function generateResetSubject(): string {
  return RESET_SUBJECT;
}

export function generateResetHtml(args?: {
  req?: PayloadRequest;
  token?: string;
  user?: { name?: string | null };
}): string {
  const serverUrl = args?.req?.payload.config.serverURL ?? '';
  return resetEmailHtml({
    url: resetUrl(serverUrl, args?.token ?? ''),
    name: args?.user?.name ?? undefined,
  });
}
