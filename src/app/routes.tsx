import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';

// Every other route is lazy-loaded — the homepage already carries the
// weight of two <Canvas> scenes, so nothing else should ride in on that
// same initial bundle. `lazy` is react-router's own route-level code
// splitting: no manual Suspense/React.lazy boilerplate needed.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      // No portfolio index page exists, so /work itself still sends the
      // visitor home — but individual case studies are real destinations
      // again, which is what gives the homepage's proof section somewhere
      // to go. Unknown slugs redirect home from inside WorkDetailPage.
      { path: 'work', element: <Navigate to="/" replace /> },
      { path: 'work/:slug', lazy: () => import('./pages/WorkDetailPage').then((m) => ({ Component: m.WorkDetailPage })) },
      { path: 'studio', lazy: () => import('./pages/StudioPage').then((m) => ({ Component: m.StudioPage })) },
      { path: 'contact', lazy: () => import('./pages/ContactPage').then((m) => ({ Component: m.ContactPage })) },
      { path: 'privacy', lazy: () => import('./pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
