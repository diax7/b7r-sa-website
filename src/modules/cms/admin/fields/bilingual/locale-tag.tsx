/**
 * The language pill on a field or a value (ADR-044, ADR-057): the code in the same pill
 * `admin.css` draws over Payload's localized label suffix (`.admin-locale-tag`). A field
 * with pills is per language and both are in front of you; a field without one is shared.
 */
export function LocaleTag({ code }: { code: string }) {
  return (
    <span className="admin-locale-tag" data-admin-locale-tag={code}>
      {code.toUpperCase()}
    </span>
  );
}
