import { Outlet } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { CustomCursor } from './CustomCursor';

export function Layout() {
  return (
    <div className="min-h-screen bg-white" style={{ overflowX: 'clip' }}>
      <ScrollToTop />
      <CustomCursor />
      <Navigation />
      <Outlet />
      <Footer />
    </div>
  );
}
