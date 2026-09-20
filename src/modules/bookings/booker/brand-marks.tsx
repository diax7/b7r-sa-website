import type { SVGProps } from 'react';

/**
 * The three calendar marks of the add-to-calendar menu (ADR-063), drawn by hand as 20 px
 * monochrome glyphs that inherit `currentColor`, like the site's other brand marks: Google
 * Calendar as its dated page, Outlook as its lettered tile, Apple as the apple. Inline,
 * since the CSP admits no external asset; decorative (the entry's text names the calendar).
 */
type MarkProps = Omit<SVGProps<SVGSVGElement>, 'children'> & { size?: number };

function Mark({ size = 20, ...rest }: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
      {...rest}
    />
  );
}

/** A calendar page with its header band and the "31" of Google's mark. */
export function GoogleCalendarMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v2h16V6a1 1 0 0 0-1-1H5Zm15 5H4v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8Z" />
      <path d="M8.2 17.4c-1.3 0-2.2-.6-2.5-1.6l1.1-.5c.2.6.7 1 1.4 1 .7 0 1.2-.4 1.2-1 0-.7-.5-1-1.3-1h-.6v-1h.6c.7 0 1.1-.4 1.1-.9 0-.6-.4-.9-1-.9-.6 0-1 .3-1.2.9l-1.1-.4c.3-1 1.2-1.6 2.3-1.6 1.3 0 2.2.7 2.2 1.8 0 .7-.4 1.2-1 1.4.7.2 1.2.8 1.2 1.6 0 1.2-1 2.2-2.4 2.2Zm5.3-.2v-5.2l-1.4.5-.3-1 2-.8h.9v6.5h-1.2Z" />
    </Mark>
  );
}

/** Outlook's tile with its letter, and the envelope flap behind it. */
export function OutlookMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M13 4.5 22 6v12l-9 1.5v-2.1l6.8-1.1v-3.6L13 15.3V13l6.8-2.9V7.6L13 6.6V4.5Z" />
      <path d="M2 6.5 12 4.8v14.4L2 17.5v-11Zm5 2.3c-1.6 0-2.6 1.3-2.6 3.2s1 3.2 2.6 3.2 2.6-1.3 2.6-3.2-1-3.2-2.6-3.2Zm0 1.3c.8 0 1.2.8 1.2 1.9s-.4 1.9-1.2 1.9-1.2-.8-1.2-1.9.4-1.9 1.2-1.9Z" />
    </Mark>
  );
}

/** The apple, as Apple's own mark draws it (Simple Icons, CC0). */
export function AppleMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </Mark>
  );
}
