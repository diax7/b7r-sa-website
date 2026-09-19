/**
 * The inbox (ADR-061), for the app layer: the contact route stores a message here before
 * it e-mails, and the panel's "Mark handled" route sets a status. The Payload config
 * imports the collection directly (`messages`); this index re-exports the admin guard,
 * which reaches the config, and a config-side import of it would be a cycle.
 */
export { adminOnly, jsonBody } from '@/modules/cms/admin-api';
export {
  MESSAGE_STATUS_LABELS,
  MESSAGE_STATUSES,
  MESSAGES,
  Messages,
  type MessageStatus,
} from '@/modules/inbox/messages';
export { originOf, originOfReferer, type Utm, utmFrom, utmOf } from '@/modules/inbox/origin';
export {
  type IncomingMessage,
  markEmailed,
  setMessageStatus,
  storeMessage,
} from '@/modules/inbox/store';
