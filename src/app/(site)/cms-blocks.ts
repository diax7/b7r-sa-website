import { ContactSection } from '@/modules/contact';
import type { ExtraRenderers } from '@/modules/pages';

/** Block renderers owned by feature modules; the pages module renders the rest. */
export const SITE_BLOCK_RENDERERS: ExtraRenderers = { contact: ContactSection };
