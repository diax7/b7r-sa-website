import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { bookMetadata, BookPage, ManagePage, manageMetadata } from '@/modules/bookings/site';

/**
 * The booking routes per locale (ADR-043, ADR-062): the Arabic and English route files are
 * thin wrappers over these, so the page, its metadata and the manage page are written once.
 */
export function bookRouteMetadata(locale: Locale): Promise<Metadata> {
  return bookMetadata(locale);
}

export function renderBook(locale: Locale) {
  return <BookPage locale={locale} />;
}

export function manageRouteMetadata(locale: Locale): Promise<Metadata> {
  return manageMetadata(locale);
}

export function renderManage(locale: Locale) {
  return <ManagePage locale={locale} />;
}
