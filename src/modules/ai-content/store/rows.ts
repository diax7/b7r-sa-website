/**
 * A language's takeaways onto the post's shared rows by id (ADR-057, PR A): the rows are one
 * list and their text is per language, so a write that sent new rows would drop the other
 * language's text. A text past the rows the post has becomes a new row.
 */
export function ontoRows(
  rows: ReadonlyArray<{ id?: string | null }> | null | undefined,
  texts: readonly string[],
): Array<{ id?: string; text: string }> {
  return texts.map((text, i) => {
    const id = rows?.[i]?.id;
    return id ? { id, text } : { text };
  });
}
