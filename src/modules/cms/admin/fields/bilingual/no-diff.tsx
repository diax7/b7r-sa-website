/**
 * The versions view renders nothing for the hidden `translations` JSON (ADR-057): an editor's
 * pending text for the other language is not a change of the document, and the diff would
 * show the JSON raw. Payload's diff view lists every field with read permission, hidden or
 * not, so a `Diff` component that renders nothing is the way to leave it out.
 */
export function NoDiff() {
  return null;
}
