import { ProcessSpace } from '../components/studio/ProcessSpace';
import { ServicesGrid } from '../components/ServicesGrid';

/* /studio: the process in depth (S1), whose camera runs on into "What we
   cover" (S2, the same grid the Services page uses). S3, the zoom into the
   team film, mounts after the grid: see `STUDIO_AFTER_SERVICES`. The print
   version (StudioProcess.tsx) and the older editorial page (Studio.tsx) are
   on disk / in git history if any of it is wanted back. */
export const STUDIO_AFTER_SERVICES = 'studio-after-services';

export function StudioPage() {
  return (
    <>
      <ProcessSpace arrival={<ServicesGrid still />} />
      <div id={STUDIO_AFTER_SERVICES} style={{ height: '20vh', background: '#FFFFFF' }} />
    </>
  );
}
