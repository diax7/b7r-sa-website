import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/shared/badge';
import { Card } from '@/components/shared/card';
import { copyFor, type SiteCopy } from '@/content/copy';
import type { PostCard as PostCardData } from '@/lib/cms/blog';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/dates';
import { type Locale, localePath } from '@/lib/i18n';
import { readingLabel } from '@/lib/reading-time';

interface PostCardProps {
  post: PostCardData;
  locale: Locale;
  headingLevel?: 'h2' | 'h3';
  /** The newest post on the blog index: a wide card with the cover beside the text. */
  featured?: boolean;
  priority?: boolean;
}

/** Post meta line per BRD 4.13: «كتبه ضياء · {date} · {n} دقائق قراءة»; the reading part is the 3–10 form. */
export function postMeta(
  copy: SiteCopy,
  locale: Locale,
  post: Pick<PostCardData, 'publishedAt' | 'readingMinutes'>,
): string {
  return copy.blog.metaTemplate
    .replace('{date}', formatDate(locale, post.publishedAt))
    .replace(copy.readingTime.few, readingLabel(copy.readingTime, post.readingMinutes));
}

/** Post card (BRD 6.11): 16:9 cover, hub chip, title, excerpt, meta. */
export function PostCard({
  post,
  locale,
  headingLevel = 'h2',
  featured = false,
  priority = false,
}: PostCardProps) {
  const copy = copyFor(locale);
  const Heading = headingLevel;
  return (
    <Card
      hoverable
      className="group flex h-full flex-col overflow-hidden"
      data-hub={post.hub.slug}
      data-post-card={featured ? 'featured' : ''}
    >
      <Link
        href={localePath(locale, `/blog/${post.slug}`)}
        className={cn('flex h-full flex-col', featured && 'md:grid md:grid-cols-2')}
      >
        <div className="relative aspect-video overflow-hidden bg-ground md:h-full">
          <Image
            src={post.cover.src}
            alt=""
            fill
            priority={priority}
            sizes={
              featured
                ? '(min-width: 1024px) 560px, 100vw'
                : '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw'
            }
            className="object-cover transition-transform duration-(--duration-slower) ease-(--ease-standard) group-hover:scale-[1.02]"
          />
        </div>
        <div
          className={cn('flex flex-1 flex-col gap-3 p-5', featured && 'md:justify-center md:p-8')}
        >
          {featured && <p className="eyebrow">{copy.blog.featured}</p>}
          <Badge tone="primary" className="self-start">
            {post.hub.name}
          </Badge>
          <Heading className={cn('text-text', featured ? 'text-h2' : 'text-h4')}>
            {post.title}
          </Heading>
          <p className="text-body text-text-muted">{post.excerpt}</p>
          <p className="mt-auto pt-2 text-caption text-text-muted">
            {postMeta(copy, locale, post)}
          </p>
        </div>
      </Link>
    </Card>
  );
}
