/** The two hero frames (BRD 6.4.1): a 16:9 desktop photo and a 4:5 mobile crop. */
export const DESKTOP = { width: 1920, height: 1080 };
export const MOBILE = { width: 1080, height: 1350 };

/**
 * The desktop photo fills the viewport up to its own width and is a card of that width past
 * it (ADR-051), so the browser never fetches a candidate wider than the photo.
 */
export const DESKTOP_SIZES = `(min-width: ${DESKTOP.width + 1}px) ${DESKTOP.width}px, 100vw`;
