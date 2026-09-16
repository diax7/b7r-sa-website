import * as migration_20260913_091427_initial from './20260913_091427_initial';
import * as migration_20260913_133525_home_faqs_testimonials_integrations from './20260913_133525_home_faqs_testimonials_integrations';
import * as migration_20260913_142543_pages from './20260913_142543_pages';
import * as migration_20260913_151043_redirects_jobs from './20260913_151043_redirects_jobs';
import * as migration_20260913_160614_designer_sample from './20260913_160614_designer_sample';
import * as migration_20260913_180113_saved_by from './20260913_180113_saved_by';
import * as migration_20260913_235455_blog from './20260913_235455_blog';
import * as migration_20260914_014437_engine from './20260914_014437_engine';
import * as migration_20260914_032706_schedules_baseline from './20260914_032706_schedules_baseline';
import * as migration_20260914_101639_product_sizes_locales from './20260914_101639_product_sizes_locales';
import * as migration_20260914_122646_posts_computed_locales from './20260914_122646_posts_computed_locales';
import * as migration_20260914_134500_seo_defaults_og_field from './20260914_134500_seo_defaults_og_field';
import * as migration_20260914_135821_engine_language from './20260914_135821_engine_language';
import * as migration_20260914_170855_hero_photos_per_locale_overlay_no_login from './20260914_170855_hero_photos_per_locale_overlay_no_login';
import * as migration_20260915_143152_menus_into_site_settings from './20260915_143152_menus_into_site_settings';
import * as migration_20260915_165626_connections from './20260915_165626_connections';
import * as migration_20260916_070828_traffic from './20260916_070828_traffic';
import * as migration_20260916_094521_visibility_checklist from './20260916_094521_visibility_checklist';
import * as migration_20260916_102554_visibility_services from './20260916_102554_visibility_services';
import * as migration_20260916_114303_visibility_ledger from './20260916_114303_visibility_ledger';
import * as migration_20260916_124404_compare_block from './20260916_124404_compare_block';

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
    name: '20260914_014437_engine',
  },
  {
    up: migration_20260914_032706_schedules_baseline.up,
    down: migration_20260914_032706_schedules_baseline.down,
    name: '20260914_032706_schedules_baseline',
  },
  {
    up: migration_20260914_101639_product_sizes_locales.up,
    down: migration_20260914_101639_product_sizes_locales.down,
    name: '20260914_101639_product_sizes_locales',
  },
  {
    up: migration_20260914_122646_posts_computed_locales.up,
    down: migration_20260914_122646_posts_computed_locales.down,
    name: '20260914_122646_posts_computed_locales',
  },
  {
    up: migration_20260914_134500_seo_defaults_og_field.up,
    down: migration_20260914_134500_seo_defaults_og_field.down,
    name: '20260914_134500_seo_defaults_og_field',
  },
  {
    up: migration_20260914_135821_engine_language.up,
    down: migration_20260914_135821_engine_language.down,
    name: '20260914_135821_engine_language',
  },
  {
    up: migration_20260914_170855_hero_photos_per_locale_overlay_no_login.up,
    down: migration_20260914_170855_hero_photos_per_locale_overlay_no_login.down,
    name: '20260914_170855_hero_photos_per_locale_overlay_no_login',
  },
  {
    up: migration_20260915_143152_menus_into_site_settings.up,
    down: migration_20260915_143152_menus_into_site_settings.down,
    name: '20260915_143152_menus_into_site_settings',
  },
  {
    up: migration_20260915_165626_connections.up,
    down: migration_20260915_165626_connections.down,
    name: '20260915_165626_connections',
  },
  {
    up: migration_20260916_070828_traffic.up,
    down: migration_20260916_070828_traffic.down,
    name: '20260916_070828_traffic',
  },
  {
    up: migration_20260916_094521_visibility_checklist.up,
    down: migration_20260916_094521_visibility_checklist.down,
    name: '20260916_094521_visibility_checklist',
  },
  {
    up: migration_20260916_102554_visibility_services.up,
    down: migration_20260916_102554_visibility_services.down,
    name: '20260916_102554_visibility_services',
  },
  {
    up: migration_20260916_114303_visibility_ledger.up,
    down: migration_20260916_114303_visibility_ledger.down,
    name: '20260916_114303_visibility_ledger',
  },
  {
    up: migration_20260916_124404_compare_block.up,
    down: migration_20260916_124404_compare_block.down,
    name: '20260916_124404_compare_block'
  },
];
