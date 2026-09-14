/**
 * Folds text for matching: Arabic diacritics dropped, hamza forms and alef maqsura unified,
 * taa marbuta kept, case and spacing normalised, so «الاسئلة» finds «الأسئلة» and «سياسه»
 * does not silently miss «سياسة». Shared by the admin palette and the blog search island.
 */
export function fold(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}
