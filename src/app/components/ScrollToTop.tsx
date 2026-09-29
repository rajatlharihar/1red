import { ScrollRestoration } from 'react-router';

/* New pages open at the top; Back and Forward return to where you were on
   the page you left (Shrikar, 2026-09-30: Back from a project used to land
   on the top of home). It was a scrollTo(0, 0) on every path change, Back
   included. The pinned scenes read their state from the scroll position,
   and the shared glide starts settled wherever the page is on mount, so
   they come back exactly as they were left. A `/#work` link lands on its
   section. */
export function ScrollToTop() {
  return <ScrollRestoration />;
}
