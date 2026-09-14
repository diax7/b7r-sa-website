import 'server-only';
import { cache } from 'react';
import type { LexicalState } from '@/lib/lexical';
import { mediaUrl } from '@/lib/cms/mappers';
import { cms, inLocale, publicRead } from '@/lib/cms/payload';
import { PUBLISHED } from '@/lib/cms/read';
import { versionedRead } from '@/lib/cms/read-mode';
import type { Locale } from '@/lib/i18n';
import type {
  Author as AuthorDoc,
  Category as CategoryDoc,
  Media,
  Post as PostDoc,
} from '@/payload-types';

/**
 * Blog reads (BRD 10.1, ADR-041): published posts, hubs and authors as plain view types the
 * templates render. One read per render (`React.cache`); the routes revalidate on publish
 * and on the 60 s timer. In a preview request the drafts come back instead (ADR-039).
 */

export const POSTS_PER_PAGE = 12;

export interface Hub {
  slug: string;
  name: string;
  description: string;
  lead: string | null;
  cover: string | null;
  order: number;
}

export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string | null;
  photo: string | null;
  sameAs: string[];
}

export interface Cover {
  src: string;
  alt: string;
  /** From the media document, for the feed's enclosure; absent for a hub's fallback cover. */
  bytes?: number;
  mime?: string;
}

export interface PostCard {
  slug: string;
  title: string;
  excerpt: string;
  hub: Hub;
  cover: Cover;
  publishedAt: string;
  contentUpdatedAt: string | null;
  readingMinutes: number;
}

export interface Post extends PostCard {
  author: Author;
  tags: string[];
  takeaways: string[];
  body: LexicalState;
  seo: { title: string; description: string; ogImage: string | null };
}

export interface PostPage {
  posts: PostCard[];
  page: number;
  totalPages: number;
  totalPosts: number;
}

/** A row the search island can match on the client; no body. */
export interface PostIndexEntry {
  slug: string;
  title: string;
  excerpt: string;
  hub: string;
}

function toHub(doc: CategoryDoc): Hub {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    lead: doc.lead ?? null,
    cover: mediaUrl(doc.defaultCover) ?? null,
    order: doc.order,
  };
}

function toAuthor(doc: AuthorDoc): Author {
  return {
    slug: doc.slug,
    name: doc.name,
    role: doc.role,
    bio: doc.bio ?? null,
    photo: mediaUrl(doc.photo) ?? null,
    sameAs: (doc.sameAs ?? []).map((row) => row.url),
  };
}

function populated<T extends object>(value: number | T | null | undefined): T | null {
  return value && typeof value === 'object' ? value : null;
}

function cover(post: PostDoc, hub: Hub): Cover {
  const media = populated<Media>(post.cover);
  const src = mediaUrl(media);
  if (!media || !src) return { src: hub.cover ?? '', alt: '' };
  return {
    src,
    alt: media.alt ?? '',
    ...(typeof media.filesize === 'number' ? { bytes: media.filesize } : {}),
    ...(media.mimeType ? { mime: media.mimeType } : {}),
  };
}

/** A card from a post read at `depth: 1`; a post whose hub is missing is skipped by the caller. */
export function toPostCard(doc: PostDoc): PostCard | null {
  const hubDoc = populated<CategoryDoc>(doc.hub);
  if (!hubDoc) return null;
  const hub = toHub(hubDoc);
  return {
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt,
    hub,
    cover: cover(doc, hub),
    publishedAt: doc.publishedAt ?? doc.createdAt,
    contentUpdatedAt: doc.contentUpdatedAt ?? null,
    readingMinutes: doc.readingMinutes ?? 1,
  };
}

export function toPost(doc: PostDoc): Post | null {
  const card = toPostCard(doc);
  const authorDoc = populated<AuthorDoc>(doc.author);
  if (!card || !authorDoc) return null;
  const ogImage = populated<Media>(doc.seo?.ogImage);
  return {
    ...card,
    author: toAuthor(authorDoc),
    tags: (doc.tags ?? [])
      .map((tag) => (typeof tag === 'object' && tag ? tag.slug : null))
      .filter((slug): slug is string => typeof slug === 'string'),
    takeaways: (doc.takeaways ?? []).map((row) => row.text),
    body: doc.body as unknown as LexicalState,
    seo: {
      title: doc.seo?.title || doc.title,
      description: doc.seo?.description || doc.excerpt,
      ogImage: mediaUrl(ogImage) ?? card.cover.src ?? null,
    },
  };
}

const SORT = '-publishedAt';

/** The hubs in their admin order. */
export const getHubs = cache(async (locale: Locale): Promise<Hub[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'categories',
    ...publicRead(locale),
    where: inLocale('name'),
    depth: 1,
    limit: 50,
    pagination: false,
    sort: 'order',
  });
  return docs.map(toHub);
});

export async function getHub(locale: Locale, slug: string): Promise<Hub | undefined> {
  return (await getHubs(locale)).find((h) => h.slug === slug);
}

export const getAllAuthors = cache(async (locale: Locale): Promise<Author[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'authors',
    ...publicRead(locale),
    where: inLocale('name'),
    depth: 1,
    limit: 50,
    pagination: false,
    sort: 'createdAt',
  });
  return docs.map(toAuthor);
});

export const getAuthor = cache(
  async (locale: Locale, slug: string): Promise<Author | undefined> => {
    const payload = await cms();
    const { docs } = await payload.find({
      collection: 'authors',
      ...publicRead(locale),
      depth: 1,
      limit: 1,
      where: { and: [{ slug: { equals: slug } }, inLocale('name')] },
    });
    return docs[0] ? toAuthor(docs[0]) : undefined;
  },
);

/**
 * Every published post as a card, newest first; drafts in a preview. Read once per render
 * and sliced by the callers: the corpus is small (BRD 10.2 caps it at one post a day) and
 * one read keeps the index, the hub pages, related and adjacent posts consistent.
 */
export const getAllPosts = cache(async (locale: Locale): Promise<PostCard[]> => {
  const payload = await cms();
  const read = await versionedRead('title');
  const { docs } = await payload.find({
    collection: 'posts',
    ...publicRead(locale),
    ...read,
    depth: 1,
    limit: 1000,
    pagination: false,
    sort: SORT,
  });
  return docs.map(toPostCard).filter((card): card is PostCard => card !== null);
});

/** One page of cards, optionally within a hub or by an author; page 1 is the first. */
export async function getPostPage(
  locale: Locale,
  page: number,
  filter: { hub?: string; author?: string } = {},
): Promise<PostPage> {
  let posts = await getAllPosts(locale);
  if (filter.hub) posts = posts.filter((p) => p.hub.slug === filter.hub);
  if (filter.author) {
    const slugs = await postSlugsByAuthor(locale, filter.author);
    posts = posts.filter((p) => slugs.has(p.slug));
  }
  const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const start = (page - 1) * POSTS_PER_PAGE;
  return {
    posts: posts.slice(start, start + POSTS_PER_PAGE),
    page,
    totalPages,
    totalPosts: posts.length,
  };
}

const postSlugsByAuthor = cache(async (locale: Locale, author: string): Promise<Set<string>> => {
  const payload = await cms();
  const read = await versionedRead('title');
  const { docs } = await payload.find({
    collection: 'posts',
    ...publicRead(locale),
    draft: read.draft,
    depth: 1,
    limit: 1000,
    pagination: false,
    where: { and: [read.where, { 'author.slug': { equals: author } }] },
  });
  return new Set(docs.map((d) => d.slug));
});

/** The index the search island embeds. */
export async function getPostIndex(locale: Locale): Promise<PostIndexEntry[]> {
  return (await getAllPosts(locale)).map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    hub: p.hub.name,
  }));
}

/** One post with its body, or undefined. */
export const getPost = cache(async (locale: Locale, slug: string): Promise<Post | undefined> => {
  const payload = await cms();
  const read = await versionedRead('title');
  const { docs } = await payload.find({
    collection: 'posts',
    ...publicRead(locale),
    draft: read.draft,
    depth: 1,
    limit: 1,
    where: { and: [read.where, { slug: { equals: slug } }] },
  });
  return docs[0] ? (toPost(docs[0]) ?? undefined) : undefined;
});

export const FEED_LIMIT = 20;

/** The latest published posts with their bodies, for the feed (never drafts). */
export const getFeedPosts = cache(async (locale: Locale): Promise<Post[]> => {
  const payload = await cms();
  const { docs } = await payload.find({
    collection: 'posts',
    ...publicRead(locale),
    where: { and: [PUBLISHED, inLocale('title')] },
    depth: 1,
    limit: FEED_LIMIT,
    sort: SORT,
  });
  return docs.map(toPost).filter((post): post is Post => post !== null);
});

/** Two related posts: same hub first (newest), then the newest others (BRD 6.11). */
export function relatedPosts(current: PostCard, all: PostCard[], count = 2): PostCard[] {
  const others = all.filter((p) => p.slug !== current.slug);
  const sameHub = others.filter((p) => p.hub.slug === current.hub.slug);
  const rest = others.filter((p) => p.hub.slug !== current.hub.slug);
  return [...sameHub, ...rest].slice(0, count);
}

/** The previous (older) and next (newer) posts within the hub, by publish date. */
export function adjacentPosts(
  current: PostCard,
  all: PostCard[],
): { previous: PostCard | null; next: PostCard | null } {
  const hub = all.filter((p) => p.hub.slug === current.hub.slug);
  const index = hub.findIndex((p) => p.slug === current.slug);
  if (index === -1) return { previous: null, next: null };
  return { next: hub[index - 1] ?? null, previous: hub[index + 1] ?? null };
}
