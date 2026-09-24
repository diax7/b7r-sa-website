import type { MailPalette } from '@/lib/mail-palette';

/**
 * A palette no brand would ship, so a test can prove an e-mail is written in the colours it
 * is handed (spec 010, phase 1d) rather than in a literal.
 */
export const TEST_PALETTE: MailPalette = {
  text: '#101112',
  muted: '#202122',
  primary: '#303132',
  ground: '#f0f1f2',
};
