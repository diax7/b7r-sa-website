import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  getAllAuthors,
  getAllPosts,
  getAuthor,
  getHub,
  getHubs,
  getPost,
  getPostPage,
  POSTS_PER_PAGE,
} from '@/lib/cms/blog';
import type { Locale } from '@/lib/i18n';
import { pageNumber } from '@/lib/page-number';
import { AuthorPage } from '@/modules/blog/author-page';
import { BlogIndex } from '@/modules/blog/blog-index';
import { BlogPostPage } from '@/modules/blog/blog-post';
import { HubPage } from '@/modules/blog/hub-page';
import {
  authorMetadata,
  blogPageMetadata,
  buildMetadata,
  hubMetadata,
  postMetadata,
} from '@/modules/core/seo/metadata';

/**
 * The blog routes per locale (ADR-041, ADR-043): the index and its pages, a hub and its
 * pages, an author and their pages, a post. Static pagination: pages 2 and up are routes of
 * their own; a page beyond the last, page 1 as a segment and anything that is not a number
 * are 404s. The Arabic and English route files are thin wrappers over these; they pass the
 * newsletter form in as a slot, so this module never imports the forms module.
 */
function pagesFrom(total: number): Array<{ n: string }> {
  const pages = Math.ceil(total / POSTS_PER_PAGE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

// The index.
export function blogIndexMetadata(locale: Locale): Promise<Metadata> {
  return buildMetadata(locale, '/blog');
}

export function renderBlogIndex(locale: Locale, newsletter: ReactNode) {
  return <BlogIndex locale={locale} page={1} newsletter={newsletter} />;
}

export async function blogPageParams(locale: Locale) {
  return pagesFrom((await getAllPosts(locale)).length);
}

export function blogPageRouteMetadata(locale: Locale, n: string): Promise<Metadata> {
  const page = pageNumber(n);
  if (!page) notFound();
  return blogPageMetadata(locale, page);
}

export async function renderBlogPage(locale: Locale, n: string, newsletter: ReactNode) {
  const page = pageNumber(n);
  if (!page) notFound();
  const listing = await getPostPage(locale, page);
  if (listing.posts.length === 0) notFound();
  return <BlogIndex locale={locale} page={page} newsletter={newsletter} />;
}

// A post.
export async function postParams(locale: Locale): Promise<Array<{ slug: string }>> {
  return (await getAllPosts(locale)).map((p) => ({ slug: p.slug }));
}

export async function postRouteMetadata(locale: Locale, slug: string): Promise<Metadata> {
  const post = await getPost(locale, slug);
  if (!post) notFound();
  return postMetadata(locale, post);
}

export async function renderPost(locale: Locale, slug: string) {
  const post = await getPost(locale, slug);
  if (!post) notFound();
  return <BlogPostPage post={post} locale={locale} />;
}

// A hub.
export async function hubParams(locale: Locale): Promise<Array<{ hub: string }>> {
  return (await getHubs(locale)).map((h) => ({ hub: h.slug }));
}

export async function hubPageParams(locale: Locale): Promise<Array<{ hub: string; n: string }>> {
  const hubs = await getHubs(locale);
  const listings = await Promise.all(hubs.map((hub) => getPostPage(locale, 1, { hub: hub.slug })));
  return hubs.flatMap((hub, i) =>
    pagesFrom(listings[i]?.totalPosts ?? 0).map(({ n }) => ({ hub: hub.slug, n })),
  );
}

export async function hubRouteMetadata(
  locale: Locale,
  slug: string,
  n?: string,
): Promise<Metadata> {
  const page = n === undefined ? 1 : pageNumber(n);
  const hub = await getHub(locale, slug);
  if (!hub || !page) notFound();
  const listing = await getPostPage(locale, 1, { hub: hub.slug });
  return hubMetadata(locale, hub, page, { empty: listing.totalPosts === 0 });
}

export async function renderHub(locale: Locale, slug: string, n?: string) {
  const page = n === undefined ? 1 : pageNumber(n);
  const hub = await getHub(locale, slug);
  if (!hub || !page) notFound();
  if (page > 1) {
    const listing = await getPostPage(locale, page, { hub: hub.slug });
    if (listing.posts.length === 0) notFound();
  }
  return <HubPage hub={hub} locale={locale} page={page} />;
}

// An author.
export async function authorParams(locale: Locale): Promise<Array<{ slug: string }>> {
  return (await getAllAuthors(locale)).map((a) => ({ slug: a.slug }));
}

export async function authorPageParams(
  locale: Locale,
): Promise<Array<{ slug: string; n: string }>> {
  const authors = await getAllAuthors(locale);
  const listings = await Promise.all(
    authors.map((author) => getPostPage(locale, 1, { author: author.slug })),
  );
  return authors.flatMap((author, i) =>
    pagesFrom(listings[i]?.totalPosts ?? 0).map(({ n }) => ({ slug: author.slug, n })),
  );
}

export async function authorRouteMetadata(
  locale: Locale,
  slug: string,
  n?: string,
): Promise<Metadata> {
  const author = await getAuthor(locale, slug);
  if (!author || (n !== undefined && !pageNumber(n))) notFound();
  const listing = await getPostPage(locale, 1, { author: author.slug });
  return authorMetadata(locale, author, { empty: listing.totalPosts === 0 });
}

export async function renderAuthor(locale: Locale, slug: string, n?: string) {
  const page = n === undefined ? 1 : pageNumber(n);
  const author = await getAuthor(locale, slug);
  if (!author || !page) notFound();
  if (page > 1) {
    const listing = await getPostPage(locale, page, { author: author.slug });
    if (listing.posts.length === 0) notFound();
  }
  return <AuthorPage author={author} locale={locale} page={page} />;
}
