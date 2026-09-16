/**
 * The site's own traffic count (ADR-048), for the app layer: the two counting routes and the
 * dashboard. The Payload config imports the collection directly. The pure halves the proxy
 * needs (`bots`, `landing`, `crawl`) live in `lib/traffic`, where the proxy may import them
 * without pulling Payload into its bundle. Nothing here imports the engine.
 */
export { botOf, looksLikeBot } from '@/lib/traffic/bots';
export { parseCrawl, parseLanding } from '@/lib/traffic/landing';
export { channelOf, sourceOf } from '@/modules/traffic/channels';
export { count, flush, startFlusher } from '@/modules/traffic/counter';
export { trafficSummary, type TrafficSummary } from '@/modules/traffic/summary';
