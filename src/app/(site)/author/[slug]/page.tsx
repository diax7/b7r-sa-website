import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllAuthors, getAuthor } from '@/lib/cms/blog';
import { AuthorPage } from '@/modules/blog';
import { authorMetadata } from '@/modules/core/seo/metadata';

interface Params {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getAllAuthors()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  return authorMetadata(author);
}

export default async function AuthorRoute({ params }: Params) {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  return <AuthorPage author={author} page={1} />;
}
