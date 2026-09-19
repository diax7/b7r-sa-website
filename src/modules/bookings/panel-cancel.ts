import type { Payload } from 'payload';
import { bookingPorts } from '@/modules/bookings/ports';
import { cancelledByStaff } from '@/modules/bookings/service';

/**
 * The collection hook's other half (ADR-062), loaded on demand: the config itself must not
 * pull the mailer and the calendar (the CLI loads it under plain Node, where `server-only`
 * throws). The flow lives in the service, tested against memory.
 */
export async function cancelledInPanel(payload: Payload, id: number): Promise<void> {
  await cancelledByStaff(await bookingPorts(payload), id);
}
