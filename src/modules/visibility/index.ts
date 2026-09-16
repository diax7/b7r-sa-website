/**
 * The visibility score (ADR-049), for the app layer. The Payload config imports the
 * checklist global directly; the dashboard and the view import the reading directly.
 */
export { reading, type Reading } from '@/modules/visibility/reading';
export { scoreOf, type Score } from '@/modules/visibility/score';
export { buildSnapshot } from '@/modules/visibility/snapshot';
export { queueLedger } from '@/modules/visibility/ledger/run';
export { queuePull } from '@/modules/visibility/pull';
export { SERVICE_TESTS } from '@/modules/visibility/services/tests';
