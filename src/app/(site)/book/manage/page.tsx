import type { Metadata } from 'next';
import { manageRouteMetadata, renderManage } from '@/modules/bookings';

export const generateMetadata = (): Promise<Metadata> => manageRouteMetadata('ar');

export default function ManageRoute() {
  return renderManage('ar');
}
