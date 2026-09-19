/**
 * The media renditions are gone from the config (ADR-029, amended 2026-09-19): the site never
 * served them, the optimizer resizes the original on demand. The `sizes_*` columns and their
 * indexes stay in the table for now, unread, so the running image keeps serving while the
 * schema moves (ADR-025); the snapshot beside this file no longer lists them, so a later
 * migration drops them by hand:
 *
 *   DROP INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx", ... (four indexes);
 *   ALTER TABLE "media" DROP COLUMN "sizes_thumbnail_url", ... (twenty-four columns:
 *   url, width, height, mime_type, filesize, filename for thumbnail, card, hero and og).
 *
 * The rendition files themselves are removed by `scripts/media-requality.ts` when it
 * re-uploads a photo, or stay as orphans until then.
 */
export async function up(): Promise<void> {
  // Schema unchanged on purpose: see above.
}

export async function down(): Promise<void> {
  // Nothing to restore: the columns were never dropped.
}
