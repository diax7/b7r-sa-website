/**
 * The `home` global in English (BRD 4.4 in translation): the localised fields only, arrays
 * in the Arabic seed's order. Facts are BRD 1.1's (SAR 30 credit, 5 days, Jeddah). The hero
 * photos are per language (ADR-044): the English placeholders are the Arabic shots mirrored
 * (`scripts/hero-crops.ts`), so the calm area sits under the start-aligned copy; Dhia's
 * English photographs replace them in the admin (RUNBOOK).
 */
export const homeEn = {
  hero: {
    slides: [
      {
        headline: 'Your brand starts with a single piece',
        subline: 'Design it and sell it; we print and ship under your name.',
        imageDesktop: '/images/hero-en/set-a-desktop.jpg',
        imageMobile: '/images/hero-en/set-a-mobile.jpg',
        alt: 'A young man in a black T-shirt printed with the B7R Print logo, with a tote bag, a cap and a hoodie beside him',
      },
      {
        headline: 'No capital, no stock',
        subline: 'We print only when an order arrives, and you profit from the first piece.',
        imageDesktop: '/images/hero-en/set-b-desktop.jpg',
        imageMobile: '/images/hero-en/set-b-mobile.jpg',
        alt: 'A young man in a white hoodie printed with "your design here", with a tote bag, a cap and a T-shirt beside him',
      },
      {
        headline: 'Jeddah to the whole Kingdom in 5 days',
        subline: 'Local production and fast shipping, with no customs and no waiting.',
        imageDesktop: '/images/hero-en/set-a-desktop.jpg',
        imageMobile: '/images/hero-en/set-a-mobile.jpg',
        alt: 'A young man in a black T-shirt printed with the B7R Print logo, with a tote bag, a cap and a hoodie beside him',
      },
      {
        headline: 'A store on Salla or Zid? Connect it in one click',
        subline: 'Orders reach us automatically and ship under your store name.',
        imageDesktop: '/images/hero-en/set-b-desktop.jpg',
        imageMobile: '/images/hero-en/set-b-mobile.jpg',
        alt: 'A young man in a white hoodie printed with "your design here", with a tote bag, a cap and a T-shirt beside him',
      },
    ],
    primaryCta: 'Start your brand for free',
    secondaryCta: 'Explore the products',
    microcopy: 'SAR 30 welcome credit, no card needed',
    chips: ['100% free', 'No minimum order', 'Kingdom-wide delivery in 5 days'],
  },
  productStrip: {
    eyebrow: 'Products',
    title: 'A sea of products',
    lead: 'Sell them in your store with no stock at all.',
    pricePrefix: 'From',
    button: 'Browse all products',
  },
  designer: {
    eyebrow: 'Try it yourself',
    title: 'See your design and work out your profit',
    lead: 'Upload your design, move it on the product, and set your price.',
    cta: 'Start selling this product',
  },
  steps: {
    eyebrow: 'How it works',
    title: 'Three steps and you are selling',
    link: 'Learn more about how it works',
    items: [
      {
        title: 'Design your product',
        text: 'Upload your design and see it on the product at once.',
      },
      { title: 'Connect your store', text: 'Salla, Zid or Shopify in one click.' },
      {
        title: 'We print and ship',
        text: 'Every order reaches us automatically and arrives at your customer under your store name.',
      },
    ],
  },
  video: {
    title: 'See how we print your order',
    lead: 'From the design file to the ready parcel, everything happens at our place in Jeddah.',
  },
  whyUs: {
    eyebrow: 'Why B7R',
    title: 'Why do merchants choose us?',
    items: [
      { title: 'No risk', text: 'Zero capital, zero stock, no minimum order.' },
      {
        title: 'Everything is automatic',
        text: 'Orders sync from your store and are fulfilled without you lifting a finger.',
      },
      {
        title: 'Local quality, fast',
        text: 'Printed in Jeddah and delivered across the Kingdom within 5 days.',
      },
    ],
  },
  testimonials: { eyebrow: 'Merchant stories', title: 'Merchants who started with us' },
  integrations: {
    title: 'Connect your store in one click',
    lead: 'Orders sync automatically from your store to B7R.',
  },
  faq: { title: 'Frequently asked questions', link: 'All questions' },
  ribbon: {
    title: 'Start today and get SAR 30 of welcome credit',
    lead: 'Sign up for free with no card, and launch your first product in minutes.',
    button: 'Start your brand for free',
  },
};
