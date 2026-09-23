'use client';

import { useFormFields } from '@payloadcms/ui';
import { fontStack, toTypeface } from '@/modules/brand/typefaces';
import { adminStrings, adminStringsAr } from '@/modules/cms/admin/strings';

/**
 * The chosen typeface on the site's own kind of line, live as the select changes: a heading
 * in bold and a paragraph in regular, in Arabic and in English whatever the panel's language,
 * since the site sets both. Every family's faces are declared in `tokens.css`, which the
 * panel's stylesheet shares, so the preview loads a family the way a page would.
 */
export function TypefacePreview() {
  const key = toTypeface(useFormFields(([fields]) => fields['typeface']?.value));
  const ar = adminStringsAr.appearance.typefacePreview;
  const en = adminStrings.appearance.typefacePreview;
  return (
    <div
      className="mb-6 flex flex-col gap-3 rounded-base border border-border bg-surface p-4"
      style={{ fontFamily: fontStack(key) }}
      data-admin-ui=""
      data-admin-typeface-preview={key}
    >
      <p lang="ar" dir="rtl" className="text-h3 font-bold text-text">
        {ar}
      </p>
      <p lang="ar" dir="rtl" className="text-body text-text">
        {ar}
      </p>
      <p lang="en" dir="ltr" className="text-body text-text-muted">
        {en}
      </p>
    </div>
  );
}
