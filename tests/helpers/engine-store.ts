import type { Integration, Product, SiteSettings } from '@/content/schema';
import type { Locale } from '@/lib/i18n';
import type { LexicalNode, LexicalState } from '@/lib/lexical';
import type { CapCounts } from '@/modules/ai-content/caps';
import { type FactsSheet, factsSheet } from '@/modules/ai-content/facts';
import type {
  EngineSettings,
  HubInfo,
  NewPost,
  Outline,
  RunPatch,
  Store,
  Topic,
} from '@/modules/ai-content/pipeline/types';
import { DEFAULT_STYLE } from '@/modules/ai-content/prompts/defaults';
import type { ConnectionSpec } from '@/modules/connections';

/** The site as the facts sheet sees it, from the seed numbers (BRD 1.1, Appendix A). */
export const SITE: SiteSettings = {
  brandName: 'بحر برنت',
  brandNameLatin: 'B7R Print',
  tagline: 'منصة الطباعة عند الطلب في السعودية',
  contact: {
    phone: '0501699572',
    phoneIntl: '+966501699572',
    whatsapp: '966501699572',
    email: 'contact@b7r.sa',
  },
  social: {
    x: 'https://x.com/b7rprint',
    instagram: 'https://instagram.com/b7rprint',
    tiktok: 'https://tiktok.com/@b7rprint',
  },
  offer: { welcomeCredit: 30 },
  delivery: { maxDays: 5, origin: 'جدة', region: 'منطقة مكة المكرمة' },
  legalEntity: 'مؤسسة بحر',
  analytics: {},
};

const product = (
  slug: string,
  name: string,
  baseCost: number,
  suggestedPrice: number,
  sortOrder: number,
): Product => ({
  slug,
  name,
  shortDescription: 'وصف قصير',
  description: 'وصف',
  baseCost,
  suggestedPrice,
  colors: [
    {
      slug: 'white',
      name: 'أبيض',
      hex: '#FFFFFF',
      images: { front: '/images/products/x/white-front.jpg' },
    },
  ],
  sizes: [{ label: 'M' }],
  sizesSummary: 'S إلى 2XL',
  material: 'قطن 100%',
  weightGrams: 180,
  printArea: {
    label: 'الواجهة الأمامية، 28 × 38 سم',
    widthCm: 28,
    heightCm: 38,
    canvas: { x: 0.25, y: 0.2, w: 0.5, h: 0.55 },
  },
  printMethodLabel: 'طباعة رقمية عالية الجودة',
  sortOrder,
  updatedAt: '2026-09-13',
});

export const PRODUCTS: Product[] = [
  product('tee-essential', 'تيشيرت أساسي', 45, 89, 1),
  product('hoodie', 'هودي', 95, 189, 2),
];

export const INTEGRATIONS: Integration[] = [
  {
    slug: 'salla',
    name: 'سلة',
    nameLatin: 'Salla',
    logo: '/images/integrations/salla.svg',
    status: 'available',
  },
  {
    slug: 'zid',
    name: 'زد',
    nameLatin: 'Zid',
    logo: '/images/integrations/zid.svg',
    status: 'available',
  },
];

export const FACTS: FactsSheet = factsSheet({
  site: SITE,
  products: PRODUCTS,
  integrations: INTEGRATIONS,
});

/** The same catalogue read for an English topic: English wording, links under `/en/`. */
export const FACTS_EN: FactsSheet = factsSheet(
  { site: SITE, products: PRODUCTS, integrations: INTEGRATIONS },
  'en',
);

/** The mock connection the tests run on: zero rates, no limit, on. */
export function connection(overrides: Partial<ConnectionSpec> = {}): ConnectionSpec {
  return {
    id: 1,
    label: 'Mock',
    kind: 'mock',
    model: 'mock',
    apiKey: null,
    baseUrl: null,
    rates: { inputPerMillionUsd: 0, outputPerMillionUsd: 0 },
    monthlyLimitUsd: null,
    enabled: true,
    ...overrides,
  };
}

export function settings(overrides: Partial<EngineSettings> = {}): EngineSettings {
  return {
    connection: connection(),
    enabled: true,
    postsPerDay: 1,
    publishHourRiyadh: 9,
    maxPostsPerMonth: 31,
    dailyCostCapUsd: 5,
    reviewFirstRuns: 3,
    systemPromptVersion: 1,
    imageMode: 'hubDefault',
    imageStyle: '',
    pexelsKey: null,
    qualityThreshold: 80,
    maxRevisionPasses: 1,
    minWords: 300,
    maxWords: 1600,
    notifyEmail: 'dhia@example.com',
    weeklyDigest: true,
    failureAlerts: true,
    ...overrides,
  };
}

export const HUB: HubInfo = {
  id: 1,
  slug: 'getting-started',
  name: 'البداية',
  description: 'أول خطوة نحو براندك.',
  defaultCoverId: 77,
  posts: [{ slug: 'start-clothing-brand-saudi-no-factory-no-stock', title: 'كيف تبدأ براند ملابس' }],
};

/** The hub as an English topic reads it (ADR-043). */
export const HUB_EN: HubInfo = {
  ...HUB,
  name: 'Getting started',
  description: 'The first step towards your brand.',
  posts: [
    {
      slug: 'start-clothing-brand-saudi-no-factory-no-stock',
      title: 'Start a clothing brand in Saudi Arabia with no factory and no stock',
    },
  ],
};

export function topic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 10,
    title: 'بيع تيشيرتات بدون رأس مال: الخطوات من التصميم لأول طلب',
    language: 'ar',
    hubId: 1,
    primaryKeyword: 'بيع تيشيرتات بدون رأس مال',
    secondaryKeywords: ['مشروع بدون مخزون'],
    intent: 'informational',
    priority: 5,
    windowStart: null,
    windowEnd: null,
    ...overrides,
  };
}

export interface MemoryState {
  settings: EngineSettings;
  /** Swapped by the freshness tests: the sheet the engine reads today. */
  facts: FactsSheet;
  /** What `createPost`/`replacePost` were asked to write in, per post id. */
  postLocales: Map<number, Locale>;
  topics: Topic[];
  topicStatus: Map<number, string>;
  topicPatches: Array<{ id: number; patch: Record<string, unknown> }>;
  runs: Map<number, Record<string, unknown>>;
  posts: Array<NewPost & { id: number }>;
  emails: Array<{ to: string; subject: string; text: string }>;
  uploads: number;
  counts: CapCounts;
  published: Array<{ title: string; primaryKeyword: string | null; publishedAt: string }>;
  reviewFirstRunsDecrements: number;
}

/** A `Store` in memory: the pipeline runs against it without a database. */
export function memoryStore(init: Partial<MemoryState> = {}): { store: Store; state: MemoryState } {
  const state: MemoryState = {
    settings: settings(),
    facts: FACTS,
    postLocales: new Map(),
    topics: [topic()],
    topicStatus: new Map(),
    topicPatches: [],
    runs: new Map(),
    posts: [],
    emails: [],
    uploads: 0,
    counts: { runsToday: 0, runsThisMonth: 0, costTodayUsd: 0, connectionSpentMonthUsd: 0 },
    published: [],
    reviewFirstRunsDecrements: 0,
    ...init,
  };
  let nextId = 100;
  const store: Store = {
    async settings() {
      return state.settings;
    },
    async style(locale) {
      return DEFAULT_STYLE[locale];
    },
    async facts(locale) {
      return locale === 'en' ? FACTS_EN : state.facts;
    },
    async pickTopic(_now, topicId, regenerate = false) {
      const pickable = regenerate
        ? ['backlog', 'failed', 'scheduled', 'published']
        : ['backlog', 'failed', 'scheduled'];
      const candidates = topicId ? state.topics.filter((t) => t.id === topicId) : state.topics;
      const free = candidates.find((t) =>
        pickable.includes(state.topicStatus.get(t.id) ?? 'backlog'),
      );
      if (!free) return null;
      state.topicStatus.set(free.id, 'generating');
      return free;
    },
    async publishedPosts() {
      return state.published;
    },
    async hub(_id, locale) {
      return locale === 'en' ? HUB_EN : HUB;
    },
    async authorId() {
      return 1;
    },
    async slugTaken(slug) {
      return state.posts.some((p) => p.slug === slug);
    },
    async counts() {
      return state.counts;
    },
    async createRun(data) {
      const id = nextId++;
      state.runs.set(id, { ...data, status: 'running' });
      return id;
    },
    async updateRun(id, patch: RunPatch) {
      state.runs.set(id, { ...state.runs.get(id), ...patch });
    },
    async updateTopic(id, patch) {
      state.topicPatches.push({ id, patch });
      if (patch.status) state.topicStatus.set(id, patch.status);
    },
    async createPost(post, locale) {
      const id = nextId++;
      state.posts.push({ ...post, id });
      state.postLocales.set(id, locale);
      return { id, slug: post.slug };
    },
    async replacePost(id, post, locale) {
      const existing = state.posts.find((p) => p.id === id);
      if (!existing) throw new Error('no post');
      Object.assign(existing, post);
      state.postLocales.set(id, locale);
      return { id, slug: existing.slug };
    },
    async postForRegeneration(id) {
      const existing = state.posts.find((p) => p.id === id);
      if (!existing) return null;
      const lastDone = [...state.runs.values()]
        .toReversed()
        .find((r) => r['status'] === 'done' && r['post'] === id);
      return {
        topicId: state.topics[0]?.id ?? null,
        slug: existing.slug,
        cover: existing.cover,
        outline: (lastDone?.['outline'] as Outline | undefined) ?? null,
      };
    },
    async uploadImage() {
      state.uploads += 1;
      return 900 + state.uploads;
    },
    async markdownToLexical(markdown): Promise<LexicalState> {
      // Enough of a tree for the tests: one paragraph per block, links kept as link nodes.
      const blocks: LexicalNode[] = markdown.split(/\n\s*\n/).map((block) => {
        const heading = /^##\s+(.+)$/.exec(block.trim());
        if (heading)
          return { type: 'heading', tag: 'h2', children: [{ type: 'text', text: heading[1]! }] };
        const children: LexicalNode[] = [];
        let rest = block;
        for (const m of block.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
          children.push({
            type: 'link',
            fields: { linkType: 'custom', url: m[2] ?? '' },
            children: [{ type: 'text', text: m[1] ?? '' }],
          });
          rest = rest.replace(m[0], '');
        }
        children.unshift({ type: 'text', text: rest });
        return { type: 'paragraph', children };
      });
      return { root: { type: 'root', children: blocks } };
    },
    async decrementReviewFirstRuns() {
      state.reviewFirstRunsDecrements += 1;
      state.settings = {
        ...state.settings,
        reviewFirstRuns: Math.max(0, state.settings.reviewFirstRuns - 1),
      };
    },
    async sendEmail(mail) {
      state.emails.push(mail);
    },
    async fetchStockPhoto(keyword) {
      return {
        bytes: new Uint8Array([1, 2, 3]),
        mime: 'image/jpeg',
        filename: `${keyword}.jpg`,
        alt: '',
      };
    },
  };
  return { store, state };
}
