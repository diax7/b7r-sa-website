import * as migration_20260913_091427_initial from './20260913_091427_initial';
import * as migration_20260913_133525_home_faqs_testimonials_integrations from './20260913_133525_home_faqs_testimonials_integrations';
import * as migration_20260913_142543_pages from './20260913_142543_pages';
import * as migration_20260913_151043_redirects_jobs from './20260913_151043_redirects_jobs';
import * as migration_20260913_160614_designer_sample from './20260913_160614_designer_sample';
import * as migration_20260913_180113_saved_by from './20260913_180113_saved_by';
import * as migration_20260913_235455_blog from './20260913_235455_blog';
import * as migration_20260914_014437_engine from './20260914_014437_engine';

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
    name: '20260913_151043_redirects_jobs',
  },
  {
    up: migration_20260913_160614_designer_sample.up,
    down: migration_20260913_160614_designer_sample.down,
    name: '20260913_160614_designer_sample',
  },
  {
    up: migration_20260913_180113_saved_by.up,
    down: migration_20260913_180113_saved_by.down,
    name: '20260913_180113_saved_by',
  },
  {
    up: migration_20260913_235455_blog.up,
    down: migration_20260913_235455_blog.down,
    name: '20260913_235455_blog',
  },
  {
    up: migration_20260914_014437_engine.up,
    down: migration_20260914_014437_engine.down,
    name: '20260914_014437_engine'
  },
];
