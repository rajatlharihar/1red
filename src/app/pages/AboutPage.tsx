import { useSearchParams } from 'react-router';
import { useReducedMotion } from 'motion/react';
import { AboutHero, BrandsStrip, PeopleCard, AboutCTA } from '../components/about/shared';
import { ChaptersPanels } from '../components/about/ChaptersPanels';
import { ChaptersBox } from '../components/about/ChaptersBox';
import { Manifesto, FactsStrip } from '../components/about/Manifesto';

/* ─── /about ───────────────────────────────────────────────────────────────
 * Hero (the Swiss row at the home poster's scale), the chapters (who, what,
 * why), the names on the table as a strip the scroll carries, the team card
 * rising onto the table, and the one call to action. The chapters are
 * picked: red panels in depth (default). ?v=b the turning box is kept for
 * comparison; ?v=c is Rajat's manifesto prototype (orbiting boxes that
 * burst) with a facts strip in place of hero and chapters. */
export function AboutPage() {
  const reduceMotion = useReducedMotion() ?? false;
  const [params] = useSearchParams();
  const v = params.get('v');
  return (
    <main style={{ background: '#fff' }}>
      {v === 'c' ? (
        <>
          <Manifesto reduceMotion={reduceMotion} />
          <FactsStrip />
        </>
      ) : (
        <>
          <AboutHero reduceMotion={reduceMotion} />
          {v === 'b' ? <ChaptersBox /> : <ChaptersPanels />}
        </>
      )}
      <BrandsStrip reduceMotion={reduceMotion} />
      <PeopleCard reduceMotion={reduceMotion} />
      <AboutCTA />
    </main>
  );
}
