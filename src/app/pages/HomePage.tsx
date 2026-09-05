import { useState, useCallback, useRef } from 'react';
import { Hero } from '../components/Hero';
import { ThreeEnvironment } from '../components/ThreeEnvironment';
import { ProjectHUD } from '../components/ProjectHUD';
import { FlashWork } from '../components/FlashWork';
import { WhatsNext } from '../components/WhatsNext';

export function HomePage() {
  // activeIndex is updated by ThreeEnvironment only when the project changes
  // (not every frame), so this single useState is perfectly cheap.
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Cube + card as one connected system: hovering the info card makes the
  // cube "notice" it (a small tilt bias — see Center3DSlot). A plain ref,
  // not state, so hovering the card never triggers a React re-render.
  const cardHoverRef = useRef(false);

  const handleProjectChange = useCallback((idx: number | null) => {
    setActiveIndex(idx);
  }, []);

  return (
    <>
      <Hero />
      {/* ThreeEnvironment + ProjectHUD share the same activeIndex state
          and cardHoverRef */}
      <ThreeEnvironment onProjectChange={handleProjectChange} cardHoverRef={cardHoverRef} />
      <ProjectHUD activeIndex={activeIndex} cardHoverRef={cardHoverRef} />
      <FlashWork />
      <WhatsNext />
    </>
  );
}
