import { SimpleContact } from '../components/contact/SimpleContact';

/* ─── /contact ─────────────────────────────────────────────────────────────
 * 2026-10-04 (Rajat): the 3x3 red-panel print was hard to read, so the page
 * is one headline row, one form and a "rather talk?" column. The panel
 * version stays on disk in contact/ContactPanels.tsx, unmounted. */
export function ContactPage() {
  return <SimpleContact />;
}
