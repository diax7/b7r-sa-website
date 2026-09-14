import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { pageNumber } from '@/lib/page-number';
import { getAllAuthors, getAuthor, getPostPage, POSTS_PER_PAGE } from '@/lib/cms/blog';
import { AuthorPage } from '@/modules/blog';
import { authorMetadata } from '@/modules/core/seo/metadata';

interface Params {
  params: Promise<{ slug: string; n: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const authors = await getAllAuthors();
  const listings = await Promise.all(
    authors.map((author) => getPostPage(1, { author: author.slug })),
  );
  return authors.flatMap((author, i) => {
    const pages = Math.ceil((listings[i]?.totalPosts ?? 0) / POSTS_PER_PAGE);
    return Array.from({ length: Math.max(0, pages - 1) }, (_, k) => ({
      slug: author.slug,
      n: String(k + 2),
    }));
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, n } = await params;
  const author = await getAuthor(slug);
  if (!author || !pageNumber(n)) notFound();
  return authorMetadata(author);
}

export default async function AuthorPageRoute({ params }: Params) {
  const { slug, n } = await params;
  const page = pageNumber(n);
  const author = await getAuthor(slug);
  if (!author || !page) notFound();
  const listing = await getPostPage(page, { author: author.slug });
  if (listing.posts.length === 0) notFound();
  return <AuthorPage author={author} page={page} />;
}
