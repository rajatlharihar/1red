import { useReducedMotion } from 'motion/react';
import { AboutHero, AboutCTA } from '../components/about/shared';

/* ─── /about ───────────────────────────────────────────────────────────────
 * 2026-10-04 (Rajat): "the first text and the last is enough". The red
 * panels in depth and the beliefs rows are gone; the hero and the close
 * remain. ChaptersPanels, ChaptersBox, Manifesto and Beliefs stay in the
 * repo, unmounted, in case a later round wants one back. */
export function AboutPage() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <main style={{ background: '#fff' }}>
      <AboutHero reduceMotion={reduceMotion} />
      <AboutCTA />
    </main>
  );
}
