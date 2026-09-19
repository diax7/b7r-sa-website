import type { CollectionConfig, GlobalConfig } from 'payload';
import { AiRuns } from '@/modules/ai-content/runs';
import { AiSettings } from '@/modules/ai-content/settings';
import { AiTopics } from '@/modules/ai-content/topics';
import { Bookings } from '@/modules/bookings/collection';
import { Booking } from '@/modules/bookings/global';
import { Authors } from '@/modules/cms/collections/authors';
import { Categories } from '@/modules/cms/collections/categories';
import { Faqs } from '@/modules/cms/collections/faqs';
import { Integrations } from '@/modules/cms/collections/integrations';
import { Media } from '@/modules/cms/collections/media';
import { Pages } from '@/modules/cms/collections/pages';
import { Posts } from '@/modules/cms/collections/posts';
import { Products } from '@/modules/cms/collections/products';
import { Tags } from '@/modules/cms/collections/tags';
import { Testimonials } from '@/modules/cms/collections/testimonials';
import { Users } from '@/modules/cms/collections/users';
import { Home } from '@/modules/cms/globals/home';
import { SeoDefaults } from '@/modules/cms/globals/seo-defaults';
import { SiteSettings } from '@/modules/cms/globals/site-settings';
import { Connections } from '@/modules/connections/collection';
import { Messages } from '@/modules/inbox/messages';
import { Traffic } from '@/modules/traffic/collection';
import { VisibilityChecklist } from '@/modules/visibility/checklist';
import { Citations } from '@/modules/visibility/ledger/citations';
import { Prompts } from '@/modules/visibility/ledger/prompts';
import { Metrics } from '@/modules/visibility/metrics';

/**
 * Every collection and global the panel serves, in one list the Payload config and
 * `tests/admin-config.test.ts` both read: a new entity joins here and the admin rules
 * (ADR-039, ADR-046) apply to it on the same commit. Redirects come from their plugin.
 */
export const COLLECTIONS: CollectionConfig[] = [
  Users,
  Media,
  Products,
  Pages,
  Faqs,
  Testimonials,
  Integrations,
  Posts,
  Categories,
  Authors,
  Tags,
  AiTopics,
  AiRuns,
  Connections,
  Bookings,
  Traffic,
  Metrics,
  Prompts,
  Citations,
  Messages,
];

export const GLOBALS: GlobalConfig[] = [
  Home,
  SiteSettings,
  Booking,
  SeoDefaults,
  AiSettings,
  VisibilityChecklist,
];
