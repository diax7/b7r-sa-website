/**
 * The brand's colours an e-mail is written in (spec 010, phase 1d). An e-mail client reads no
 * stylesheet, so the values go into the markup, read from the Appearance global at send time
 * by whoever sends the mail (`readMailPalette` in the brand module): a rebrand reaches the
 * next e-mail without a deploy.
 */
export interface MailPalette {
  /** Headings and body text. */
  text: string;
  /** Labels and the small print. */
  muted: string;
  /** Links, and a button's fill with white words on it. */
  primary: string;
  /** The page behind a card. */
  ground: string;
}
