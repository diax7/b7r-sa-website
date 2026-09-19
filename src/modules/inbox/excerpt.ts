/** The first words of a message on the dashboard card (ADR-061): one line, cut at a word, never the whole text. */
export const EXCERPT_LENGTH = 80;

export function excerptOf(text: string, length = EXCERPT_LENGTH): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= length) return oneLine;
  const cut = oneLine.slice(0, length);
  const atWord = cut.lastIndexOf(' ');
  return `${atWord > length / 2 ? cut.slice(0, atWord) : cut}…`;
}
