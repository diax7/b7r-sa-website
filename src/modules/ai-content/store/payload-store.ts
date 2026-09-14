import { Buffer } from 'node:buffer';
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical';
import type { Payload } from 'payload';
import type { LexicalState } from '@/lib/lexical';
import { toIntegration, toProduct, toSiteSettings } from '@/lib/cms/mappers';
import { PUBLISHED } from '@/lib/cms/read';
import { riyadhDayStart, riyadhMonthStart } from '@/modules/ai-content/caps';
import type { PublishedPost } from '@/modules/ai-content/dedupe';
import { type FactsSheet, factsSheet } from '@/modules/ai-content/facts';
import type {
  EngineSettings,
  HubInfo,
  MediaUpload,
  NewPost,
  RunPatch,
  Store,
  Topic,
} from '@/modules/ai-content/pipeline/types';
import type { ProviderName } from '@/modules/ai-content/provider/types';
import { DECRYPT_CONTEXT } from '@/modules/ai-content/secret-field';
import { DEFAULT_AUTHOR_SLUG } from '@/modules/cms/collections/posts';
import type { AiSetting, AiTopic, Category, Post } from '@/payload-types';

/**
 * The pipeline's `Store` on Payload's Local API (ADR-042): every read and write the engine
 * makes, with `overrideAccess` (no user behind a job) and, for the settings, the
 * `decryptKeys` context that reveals the provider keys.
 */
const VENDORS = ['openai', 'deepseek', 'anthropic', 'google'] as const;

function lines(text: string | null | undefined): string[] {
  return (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function toEngineSettings(doc: AiSetting): EngineSettings {
  const providers = Object.fromEntries(
    VENDORS.map((vendor) => {
      const group = doc.providers?.[vendor];
      return [
        vendor,
        {
          model: group?.model ?? '',
          apiKey: group?.apiKey ?? null,
          rates: {
            inputPerMillionUsd: group?.inputPerMillionUsd ?? 0,
            outputPerMillionUsd: group?.outputPerMillionUsd ?? 0,
          },
        },
      ];
    }),
  ) as EngineSettings['providers'];
  return {
    activeProvider: (doc.activeProvider ?? 'openai') as ProviderName,
    providers,
    enabled: Boolean(doc.enabled),
    postsPerDay: doc.postsPerDay ?? 1,
    publishHourRiyadh: doc.publishHourRiyadh ?? 9,
    maxPostsPerMonth: doc.maxPostsPerMonth ?? 31,
    dailyCostCapUsd: doc.dailyCostCapUsd ?? 5,
    reviewFirstRuns: doc.reviewFirstRuns ?? 3,
    styleGuide: doc.style?.styleGuide ?? '',
    systemPrompt: doc.style?.systemPrompt ?? '',
    systemPromptVersion: doc.style?.systemPromptVersion ?? 1,
    bannedPhrases: lines(doc.style?.bannedPhrases),
    bannedClaims: doc.style?.bannedClaims ?? '',
    imageMode: (doc.images?.imageMode ?? 'hubDefault') as EngineSettings['imageMode'],
    imageStyle: doc.images?.imageStyle ?? '',
    pexelsKey: doc.images?.pexelsKey ?? null,
    qualityThreshold: doc.quality?.qualityThreshold ?? 80,
    maxRevisionPasses: doc.quality?.maxRevisionPasses ?? 1,
    minWords: doc.quality?.minWords ?? 800,
    maxWords: doc.quality?.maxWords ?? 1600,
    notifyEmail: doc.notifications?.notifyEmail ?? null,
    weeklyDigest: doc.notifications?.weeklyDigest !== false,
    failureAlerts: doc.notifications?.failureAlerts !== false,
  };
}

function toTopic(doc: AiTopic): Topic {
  return {
    id: doc.id,
    title: doc.title,
    hubId: typeof doc.hub === 'object' ? doc.hub.id : doc.hub,
    primaryKeyword: doc.primaryKeyword,
    secondaryKeywords: (doc.secondaryKeywords ?? []).map((k) => k.keyword),
    intent: doc.intent,
    priority: doc.priority,
    windowStart: doc.windowStart ?? null,
    windowEnd: doc.windowEnd ?? null,
  };
}

const PEXELS = 'https://api.pexels.com/v1/search';

export function payloadStore(payload: Payload): Store {
  const ctx = { [DECRYPT_CONTEXT]: true };
  return {
    async settings() {
      const doc = await payload.findGlobal({
        slug: 'ai-settings',
        depth: 0,
        overrideAccess: true,
        context: ctx,
      });
      return toEngineSettings(doc);
    },

    async facts(): Promise<FactsSheet> {
      const [site, products, integrations] = await Promise.all([
        payload.findGlobal({ slug: 'site-settings', depth: 0, locale: 'ar', overrideAccess: true }),
        payload.find({
          collection: 'products',
          depth: 1,
          limit: 50,
          pagination: false,
          locale: 'ar',
          where: PUBLISHED,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'integrations',
          depth: 0,
          limit: 20,
          pagination: false,
          locale: 'ar',
          overrideAccess: true,
        }),
      ]);
      return factsSheet({
        site: toSiteSettings(site),
        products: products.docs.map(toProduct),
        integrations: integrations.docs.map(toIntegration),
      });
    },

    async pickTopic(now, topicId) {
      const iso = now.toISOString();
      const open = {
        and: [
          { or: [{ windowStart: { exists: false } }, { windowStart: { less_than_equal: iso } }] },
          { or: [{ windowEnd: { exists: false } }, { windowEnd: { greater_than_equal: iso } }] },
        ],
      };
      const where = topicId
        ? {
            and: [
              { id: { equals: topicId } },
              { status: { in: ['backlog', 'failed', 'scheduled'] } },
            ],
          }
        : { and: [{ status: { equals: 'backlog' } }, open] };
      const { docs } = await payload.find({
        collection: 'ai-topics',
        where,
        depth: 0,
        limit: 10,
        sort: ['-priority', 'createdAt'],
        overrideAccess: true,
      });
      for (const doc of docs) {
        // Compare-and-set, one candidate at a time: only the runner that flips the status
        // owns the topic; a lost race moves to the next candidate.
        // oxlint-disable-next-line no-await-in-loop
        const result = await payload.update({
          collection: 'ai-topics',
          where: { and: [{ id: { equals: doc.id } }, { status: { equals: doc.status } }] },
          data: { status: 'generating', lastError: null },
          depth: 0,
          overrideAccess: true,
        });
        if (result.docs.length === 1) return toTopic(result.docs[0]!);
      }
      return null;
    },

    async publishedPosts(): Promise<PublishedPost[]> {
      const [posts, topics] = await Promise.all([
        payload.find({
          collection: 'posts',
          where: PUBLISHED,
          depth: 0,
          limit: 1000,
          pagination: false,
          locale: 'ar',
          overrideAccess: true,
        }),
        payload.find({
          collection: 'ai-topics',
          where: { post: { exists: true } },
          depth: 0,
          limit: 1000,
          pagination: false,
          overrideAccess: true,
        }),
      ]);
      const keywordByPost = new Map<number, string>();
      for (const t of topics.docs) {
        const id = typeof t.post === 'object' && t.post ? t.post.id : t.post;
        if (typeof id === 'number') keywordByPost.set(id, t.primaryKeyword);
      }
      return posts.docs.map((p) => ({
        title: p.title,
        primaryKeyword: keywordByPost.get(p.id) ?? null,
        publishedAt: p.publishedAt ?? p.createdAt,
      }));
    },

    async hub(id): Promise<HubInfo> {
      const doc = (await payload.findByID({
        collection: 'categories',
        id,
        depth: 0,
        locale: 'ar',
        overrideAccess: true,
      })) as Category;
      const posts = await payload.find({
        collection: 'posts',
        where: { and: [PUBLISHED, { hub: { equals: id } }] },
        depth: 0,
        limit: 50,
        sort: '-publishedAt',
        locale: 'ar',
        overrideAccess: true,
      });
      return {
        id: doc.id,
        slug: doc.slug,
        name: doc.name,
        description: doc.description,
        defaultCoverId:
          typeof doc.defaultCover === 'object' && doc.defaultCover
            ? doc.defaultCover.id
            : (doc.defaultCover ?? null),
        posts: posts.docs.map((p) => ({ slug: p.slug, title: p.title })),
      };
    },

    async authorId() {
      const seeded = await payload.find({
        collection: 'authors',
        where: { slug: { equals: DEFAULT_AUTHOR_SLUG } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      });
      if (seeded.docs[0]) return seeded.docs[0].id;
      const first = await payload.find({
        collection: 'authors',
        depth: 0,
        limit: 1,
        sort: 'createdAt',
        overrideAccess: true,
      });
      if (!first.docs[0]) throw new Error('no author to sign the post; seed the blog first');
      return first.docs[0].id;
    },

    async slugTaken(slug) {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: { slug: { equals: slug } },
        overrideAccess: true,
      });
      return totalDocs > 0;
    },

    async counts(now) {
      const day = riyadhDayStart(now).toISOString();
      const month = riyadhMonthStart(now).toISOString();
      const [today, thisMonth] = await Promise.all([
        payload.find({
          collection: 'ai-runs',
          where: {
            and: [
              { kind: { equals: 'generate' } },
              { startedAt: { greater_than_equal: day } },
              { status: { not_equals: 'skipped' } },
            ],
          },
          depth: 0,
          limit: 200,
          pagination: false,
          overrideAccess: true,
        }),
        payload.count({
          collection: 'ai-runs',
          where: {
            and: [
              { kind: { equals: 'generate' } },
              { startedAt: { greater_than_equal: month } },
              { status: { not_equals: 'skipped' } },
            ],
          },
          overrideAccess: true,
        }),
      ]);
      return {
        runsToday: today.docs.length,
        runsThisMonth: thisMonth.totalDocs,
        costTodayUsd: today.docs.reduce((n, r) => n + (r.costUsd ?? 0), 0),
      };
    },

    async createRun(data) {
      const doc = await payload.create({
        collection: 'ai-runs',
        data: { ...data, status: 'running' },
        depth: 0,
        overrideAccess: true,
      });
      return doc.id;
    },

    async updateRun(id, patch: RunPatch) {
      await payload.update({
        collection: 'ai-runs',
        id,
        data: patch as never,
        depth: 0,
        overrideAccess: true,
      });
    },

    async updateTopic(id, patch) {
      await payload.update({
        collection: 'ai-topics',
        id,
        data: patch as never,
        depth: 0,
        overrideAccess: true,
      });
    },

    async createPost(post: NewPost) {
      const doc = await payload.create({
        collection: 'posts',
        data: {
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          hub: post.hub,
          author: post.author,
          cover: post.cover,
          takeaways: post.takeaways.map((text) => ({ text })),
          body: post.body as unknown as Post['body'],
          seo: post.seo,
          publishedAt: post.publishedAt,
          origin: 'ai',
          _status: post.status,
        },
        draft: post.status === 'draft',
        depth: 0,
        locale: 'ar',
        overrideAccess: true,
      });
      return { id: doc.id, slug: doc.slug };
    },

    async replacePost(id, post) {
      const doc = await payload.update({
        collection: 'posts',
        id,
        data: {
          title: post.title,
          excerpt: post.excerpt,
          takeaways: post.takeaways.map((text) => ({ text })),
          body: post.body as unknown as Post['body'],
          seo: post.seo,
          contentUpdatedAt: post.publishedAt,
          origin: 'ai',
          _status: 'published',
        },
        depth: 0,
        locale: 'ar',
        overrideAccess: true,
      });
      return { id: doc.id, slug: doc.slug };
    },

    async postForRegeneration(id) {
      const post = await payload.findByID({
        collection: 'posts',
        id,
        depth: 0,
        overrideAccess: true,
        disableErrors: true,
      });
      if (!post) return null;
      const topics = await payload.find({
        collection: 'ai-topics',
        where: { post: { equals: id } },
        depth: 0,
        limit: 1,
        overrideAccess: true,
      });
      const cover = typeof post.cover === 'object' && post.cover ? post.cover.id : post.cover;
      return { topicId: topics.docs[0]?.id ?? null, slug: post.slug, cover };
    },

    async uploadImage(upload: MediaUpload) {
      const data = Buffer.from(upload.bytes);
      const doc = await payload.create({
        collection: 'media',
        data: { alt: upload.alt },
        file: { data, name: upload.filename, mimetype: upload.mime, size: data.byteLength },
        depth: 0,
        overrideAccess: true,
      });
      return doc.id;
    },

    async markdownToLexical(markdown: string): Promise<LexicalState> {
      const field = payload.collections['posts']?.config.fields.find(
        (f) => 'name' in f && f.name === 'body',
      );
      if (!field || field.type !== 'richText') throw new Error('posts: no body field');
      const editorConfig = editorConfigFactory.fromField({ field });
      return convertMarkdownToLexical({ editorConfig, markdown }) as unknown as LexicalState;
    },

    async decrementReviewFirstRuns() {
      const doc = await payload.findGlobal({ slug: 'ai-settings', depth: 0, overrideAccess: true });
      const next = Math.max(0, (doc.reviewFirstRuns ?? 0) - 1);
      await payload.updateGlobal({
        slug: 'ai-settings',
        data: { reviewFirstRuns: next },
        depth: 0,
        overrideAccess: true,
      });
    },

    async sendEmail(mail) {
      await payload.sendEmail({ to: mail.to, subject: mail.subject, text: mail.text });
    },

    async fetchStockPhoto(keyword, apiKey) {
      const url = `${PEXELS}?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`;
      const res = await fetch(url, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`Pexels answered ${res.status}`);
      const json = (await res.json()) as {
        photos?: Array<{
          id: number;
          src?: { large2x?: string; large?: string };
          photographer?: string;
        }>;
      };
      const photo = json.photos?.[0];
      const src = photo?.src?.large2x ?? photo?.src?.large;
      if (!photo || !src) return null;
      const image = await fetch(src, { signal: AbortSignal.timeout(30_000) });
      if (!image.ok) throw new Error(`Pexels photo answered ${image.status}`);
      return {
        bytes: new Uint8Array(await image.arrayBuffer()),
        mime: image.headers.get('content-type') ?? 'image/jpeg',
        filename: `pexels-${photo.id}.jpg`,
        alt: '',
      };
    },
  };
}
