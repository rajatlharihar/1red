import { useEffect } from 'react';
import { Work } from '../components/Work';

/* /work: the scrolling gallery of everything, with the Behance cases
   embedded. Reached from the home page's "Explore more" badge. */
export function WorkPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ paddingTop: '5rem' }}>
      <Work />
    </div>
  );
}
