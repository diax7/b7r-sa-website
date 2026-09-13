import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { blogCopy, hubName } from '@/content/blog';
import type { BlogPost } from '@/content/schema';
import { formatArabicDate } from '@/lib/dates';
import { readingLabel } from '@/lib/reading-time';

interface PostCardProps {
  post: BlogPost;
  readingMinutes: number;
  headingLevel?: 'h2' | 'h3';
}

/** Post meta line per BRD 4.13: «كتبه ضياء · {date} · {n} دقائق قراءة». */
export function postMeta(post: BlogPost, readingMinutes: number): string {
  return blogCopy.metaTemplate
    .replace('{date}', formatArabicDate(post.publishedAt))
    .replace('{n} دقائق قراءة', readingLabel(readingMinutes));
}

/** Post card (BRD 6.11): 16:9 cover, hub chip, title, excerpt, meta. */
export function PostCard({ post, readingMinutes, headingLevel = 'h2' }: PostCardProps) {
  const Heading = headingLevel;
  return (
    <Card hoverable className="group flex h-full flex-col overflow-hidden" data-hub={post.hub}>
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        <div className="relative aspect-video overflow-hidden bg-ground">
          <Image
            src={post.cover}
            alt=""
            fill
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-(--duration-slower) ease-(--ease-standard) group-hover:scale-[1.02]"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <Badge tone="primary" className="self-start">
            {hubName(post.hub)}
          </Badge>
          <Heading className="text-h4 text-text">{post.title}</Heading>
          <p className="text-body text-text-muted">{post.excerpt}</p>
          <p className="mt-auto pt-2 text-caption text-text-muted">
            {postMeta(post, readingMinutes)}
          </p>
        </div>
      </Link>
    </Card>
  );
}
