import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BlogPost } from '@/content/schema';
import { readingMinutes } from '@/lib/reading-time';

export type LoadedPost = BlogPost & { body: string; readingMinutes: number };

/** Body from `posts/{slug}.md` plus the computed reading time (server only, build time). */
export function loadBlogPost(post: BlogPost): LoadedPost {
  const body = readFileSync(
    join(process.cwd(), 'src', 'content', 'blog', 'posts', `${post.slug}.md`),
    'utf8',
  );
  return { ...post, body, readingMinutes: readingMinutes(body) };
}
