import type { MetadataRoute } from 'next';
import { env, PRODUCTION_SITE_URL } from '@/lib/env';
import { robotsRules } from '@/modules/core/seo/robots';

export default function robots(): MetadataRoute.Robots {
  return robotsRules(env.isProductionSite, PRODUCTION_SITE_URL);
}
