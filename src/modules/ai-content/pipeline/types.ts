import type { Locale } from '@/lib/i18n';
import type { LexicalState } from '@/lib/lexical';
import type { CapCounts } from '@/modules/ai-content/caps';
import type { Usage } from '@/modules/ai-content/cost';
import type { PublishedPost } from '@/modules/ai-content/dedupe';
import type { FactNumber, FactsSheet } from '@/modules/ai-content/facts';
import type { Provider } from '@/modules/ai-content/provider/types';
import type { ConnectionSpec } from '@/modules/connections/kinds';

/**
 * The settings the pipeline reads, the connection's key revealed (the Local API reads carry
 * `decryptKeys`). `connection` is null when the settings name none (ADR-047).
 */
export interface EngineSettings {
  connection: ConnectionSpec | null;
  enabled: boolean;
  postsPerDay: number;
  publishHourRiyadh: number;
  maxPostsPerMonth: number;
  dailyCostCapUsd: number;
  reviewFirstRuns: number;
  systemPromptVersion: number;
  imageMode: 'hubDefault' | 'stock' | 'generate';
  imageStyle: string;
  pexelsKey: string | null;
  qualityThreshold: number;
  maxRevisionPasses: number;
  minWords: number;
  maxWords: number;
  notifyEmail: string | null;
  weeklyDigest: boolean;
  failureAlerts: boolean;
}

/** The style of one language (ADR-043): the localised fields of the settings' style tab. */
export interface EngineStyle {
  styleGuide: string;
  systemPrompt: string;
  bannedPhrases: string[];
  bannedClaims: string;
}

export interface Topic {
  id: number;
  title: string;
  /** The language the post is written in; every read and write of the run follows it. */
  language: Locale;
  hubId: number;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: 'informational' | 'commercial' | 'seasonal';
  priority: number;
  windowStart: string | null;
  windowEnd: string | null;
}

export interface HubInfo {
  id: number;
  slug: string;
  name: string;
  description: string;
  defaultCoverId: number | null;
  /** Published posts in the hub, for internal links and dedupe. */
  posts: Array<{ slug: string; title: string }>;
}

export interface Outline {
  headings: Array<{ question: string; answer: string }>;
  takeaways: string[];
  imageKeyword: string;
}

export interface Rubric {
  facts: number;
  /** Clear, natural prose in the topic's language with no banned phrases (was `arabic`). */
  language: number;
  structure: number;
  usefulness: number;
  formatting: number;
  critique: string;
}

export interface SeoResult {
  title: string;
  description: string;
  slug: string;
  alt: string;
}

export interface StepRecord {
  name: string;
  inputHash: string;
  summary: string;
  ms: number;
  ok: boolean;
}

export interface RunPatch {
  status?: 'running' | 'done' | 'failed' | 'skipped';
  steps?: StepRecord[];
  outline?: Outline;
  score?: number;
  rubric?: Rubric & { deductions: Array<{ rule: string; points: number; detail: string }> };
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  durationMs?: number;
  post?: number;
  error?: string;
  finishedAt?: string;
  label?: string;
}

export interface NewPost {
  title: string;
  slug: string;
  excerpt: string;
  hub: number;
  author: number;
  cover: number;
  takeaways: string[];
  body: LexicalState;
  seo: { title: string; description: string };
  publishedAt: string;
  status: 'draft' | 'published';
  /** The facts sheet's numbers at writing time: the freshness job's baseline. */
  factsBaseline: FactNumber[];
}

export interface MediaUpload {
  bytes: Uint8Array;
  mime: string;
  filename: string;
  alt: string;
}

/**
 * Everything the pipeline touches outside itself. `payloadStore` implements it on the Local
 * API; the unit tests use an in-memory one, so the nine steps run without a database.
 */
export interface Store {
  settings(): Promise<EngineSettings>;
  /** The style tab in one language; the code defaults when the language was never filled. */
  style(locale: Locale): Promise<EngineStyle>;
  facts(locale: Locale): Promise<FactsSheet>;
  /**
   * Compare-and-set: the topic (given or the best backlog one) moves to `generating`, or
   * null. A `published` topic is only picked to regenerate its post.
   */
  pickTopic(now: Date, topicId?: number, regenerate?: boolean): Promise<Topic | null>;
  publishedPosts(locale: Locale): Promise<PublishedPost[]>;
  hub(id: number, locale: Locale): Promise<HubInfo>;
  authorId(): Promise<number>;
  slugTaken(slug: string): Promise<boolean>;
  counts(now: Date): Promise<CapCounts>;
  createRun(data: {
    label: string;
    kind: 'generate' | 'freshness';
    topic?: number;
    connection?: number;
    provider: string;
    model: string;
    systemPromptVersion: number;
    startedAt: string;
  }): Promise<number>;
  updateRun(id: number, patch: RunPatch): Promise<void>;
  updateTopic(
    id: number,
    patch: { status?: string; post?: number; lastRun?: number; lastError?: string | null },
  ): Promise<void>;
  createPost(post: NewPost, locale: Locale): Promise<{ id: number; slug: string }>;
  /** A regeneration: the same slug and cover, new content, keeps the id. */
  replacePost(
    id: number,
    post: Omit<NewPost, 'slug' | 'cover' | 'status'>,
    locale: Locale,
  ): Promise<{ id: number; slug: string }>;
  /** The post's topic, slug, cover and the outline of its last successful run. */
  postForRegeneration(id: number): Promise<{
    topicId: number | null;
    slug: string;
    cover: number;
    outline: Outline | null;
  } | null>;
  uploadImage(upload: MediaUpload): Promise<number>;
  markdownToLexical(markdown: string): Promise<LexicalState>;
  decrementReviewFirstRuns(): Promise<void>;
  sendEmail(mail: { to: string; subject: string; text: string }): Promise<void>;
  fetchStockPhoto?(keyword: string, apiKey: string): Promise<MediaUpload | null>;
}

export interface PipelineInput {
  /** A given topic (Generate now) or the best of the backlog. */
  topicId?: number;
  /** Skip the publish hour (a person pressed the button); never the switch or the caps. */
  manual?: boolean;
  /** Regenerate this post from the topic it came from (same slug and cover). */
  replacePostId?: number;
  kind?: 'generate' | 'freshness';
}

/** Runs a step; the workflow wraps this in Payload's inline task for retries and the job log. */
export type StepRunner = <T>(
  name: string,
  fn: () => Promise<T>,
  options?: { retries?: number },
) => Promise<T>;

export interface PipelineContext {
  store: Store;
  provider: Provider;
  now: () => Date;
  run: StepRunner;
  env?: Record<string, string | undefined>;
}

export interface PipelineResult {
  status: 'done' | 'failed' | 'skipped';
  runId: number | null;
  postId: number | null;
  score: number | null;
  reason: string | null;
  usage: Usage;
}
