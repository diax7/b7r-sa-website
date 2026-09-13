import type { Integration } from '@/content/schema';

/** BRD 4.4 integrations tiles: seed for the `integrations` collection; the logos ship with the code. */
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
