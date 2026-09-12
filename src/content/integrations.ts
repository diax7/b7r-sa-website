import type { Integration } from '@/content/schema';

/** BRD 4.4 integrations tiles. Logos are added in Phase 1b from the official brand assets. */
export const integrations: Integration[] = [
  {
    slug: 'salla',
    name: 'سلة',
    nameLatin: 'Salla',
    logo: '/images/integrations/salla.svg',
    status: 'available',
  },
  {
    slug: 'zid',
    name: 'زد',
    nameLatin: 'Zid',
    logo: '/images/integrations/zid.svg',
    status: 'available',
  },
  {
    slug: 'shopify',
    name: 'شوبيفاي',
    nameLatin: 'Shopify',
    logo: '/images/integrations/shopify.svg',
    status: 'available',
  },
];
