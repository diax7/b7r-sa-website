import * as migration_20260913_091427_initial from './20260913_091427_initial';
import * as migration_20260913_133525_home_faqs_testimonials_integrations from './20260913_133525_home_faqs_testimonials_integrations';
import * as migration_20260913_142543_pages from './20260913_142543_pages';
import * as migration_20260913_151043_redirects_jobs from './20260913_151043_redirects_jobs';

export const migrations = [
  {
    up: migration_20260913_091427_initial.up,
    down: migration_20260913_091427_initial.down,
    name: '20260913_091427_initial',
  },
  {
    up: migration_20260913_133525_home_faqs_testimonials_integrations.up,
    down: migration_20260913_133525_home_faqs_testimonials_integrations.down,
    name: '20260913_133525_home_faqs_testimonials_integrations',
  },
  {
    up: migration_20260913_142543_pages.up,
    down: migration_20260913_142543_pages.down,
    name: '20260913_142543_pages',
  },
  {
    up: migration_20260913_151043_redirects_jobs.up,
    down: migration_20260913_151043_redirects_jobs.down,
    name: '20260913_151043_redirects_jobs'
  },
];
