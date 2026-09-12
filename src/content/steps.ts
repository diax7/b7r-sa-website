import type { Step } from '@/content/schema';

/** Homepage three steps (BRD 4.4) and how-it-works five steps (BRD 4.9). */
export const homeSteps: Step[] = [
  {
    order: 1,
    title: 'صمّم منتجك',
    text: 'ارفع تصميمك وشاهده على المنتج فوراً.',
    icon: '/images/icons-3d/tee-plus-create-product.jpg',
  },
  {
    order: 2,
    title: 'اربط متجرك',
    text: 'سلة أو زد أو شوبيفاي بضغطة واحدة.',
    icon: '/images/icons-3d/laptop-link-connect-store.jpg',
  },
  {
    order: 3,
    title: 'نطبع ونشحن',
    text: 'كل طلب يصلنا تلقائياً ويوصل عميلك باسم متجرك.',
    icon: '/images/icons-3d/printer-print.jpg',
  },
];

export const howItWorksSteps: Step[] = [
  {
    order: 1,
    title: 'أنشئ حسابك مجاناً',
    text: 'سجّل خلال دقيقة واحصل على 30 ريالاً رصيداً ترحيبياً.',
    icon: '/images/icons-3d/tee-plus-create-product.jpg',
  },
  {
    order: 2,
    title: 'اختر منتجك وصمّمه',
    text: 'ارفع تصميمك وشاهده على المنتج مباشرة، وحدّد سعر البيع.',
    icon: '/images/icons-3d/laptop-link-connect-store.jpg',
  },
  {
    order: 3,
    title: 'اربط متجرك',
    text: 'سلة أو زد أو شوبيفاي، بربط آمن وبدون مشاركة أي بيانات حساسة.',
    icon: '/images/icons-3d/bag-and-parcel-order.jpg',
  },
  {
    order: 4,
    title: 'انشر المنتج بضغطة',
    text: 'يُزامَن الاسم والصور والخيارات والسعر إلى متجرك تلقائياً.',
    icon: '/images/icons-3d/printer-print.jpg',
  },
  {
    order: 5,
    title: 'نطبع ونغلّف ونشحن',
    text: 'كل طلب يصلنا فور شرائه، نخصم التكلفة من محفظتك، ونشحنه باسم متجرك خلال 5 أيام كحد أقصى.',
    icon: '/images/icons-3d/truck-delivery.jpg',
  },
];
