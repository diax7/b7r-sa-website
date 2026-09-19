import { copyFor } from '@/content/copy';
import type { BookingSettings } from '@/content/schema';
import type { Locale } from '@/lib/i18n';
import type { PickerSettings } from '@/modules/bookings/picker/days';
import type { PickerCopy } from '@/modules/bookings/picker/validate';
import { openWeekdays, rulesOf } from '@/modules/bookings/slots';

/** The slice of the bank the island reads (server side, so the bank never reaches the chunk). */
export function pickerCopy(locale: Locale): PickerCopy {
  const c = copyFor(locale);
  return {
    booking: c.booking,
    labels: c.contactForm.labels,
    placeholders: c.contactForm.placeholders,
    validation: c.contactForm.validation,
    whatsapp: c.contactForm.successWhatsapp,
    loading: c.a11y.loading,
    dateLocale: c.dateLocale,
  };
}

/** What the island needs of the settings to draw the strip before asking the API. */
export function pickerSettings(settings: BookingSettings): PickerSettings {
  return {
    title: settings.title,
    durationMinutes: settings.durationMinutes,
    horizonDays: settings.horizonDays,
    noticeHours: settings.noticeHours,
    openWeekdays: openWeekdays(rulesOf(settings)),
    closedDates: settings.closedDates.map((c) => ({ date: c.date, reason: c.reason })),
  };
}
