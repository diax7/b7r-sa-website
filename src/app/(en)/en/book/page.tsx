import type { Metadata } from 'next';
import { bookRouteMetadata, renderBook } from '@/modules/bookings';

export const generateMetadata = (): Promise<Metadata> => bookRouteMetadata('en');

export default function BookRoute() {
  return renderBook('en');
}
