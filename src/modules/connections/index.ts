/**
 * The AI connections (ADR-047), for the app layer (the test route). The Payload config and
 * the engine import the files directly (`collection`, `kinds`, `model`, `read`, `spend`):
 * this index re-exports the admin guard, which reaches the config, and a config-side import
 * of it would be a cycle. The engine depends on this module; nothing here imports the engine.
 */
export { adminOnly, jsonBody } from '@/modules/cms/admin-api';
export { Connections, CONNECTIONS } from '@/modules/connections/collection';
export {
  CONNECTION_KINDS,
  type ConnectionKind,
  type ConnectionSpec,
  isConnectionKind,
  KINDS,
  mockAllowed,
} from '@/modules/connections/kinds';
export { languageModel, type ModelSpec } from '@/modules/connections/model';
export { readConnection, toConnectionSpec } from '@/modules/connections/read';
export { connectionSpend, type ConnectionSpend } from '@/modules/connections/spend';
export { testConnection } from '@/modules/connections/test';
