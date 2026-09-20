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
      // /work is the full gallery (WorkPage); individual case studies are
      // real destinations too. Unknown slugs redirect home from inside
      // WorkDetailPage.
      { path: 'work', lazy: () => import('./pages/WorkPage').then((m) => ({ Component: m.WorkPage })) },
      { path: 'work/:slug', lazy: () => import('./pages/WorkDetailPage').then((m) => ({ Component: m.WorkDetailPage })) },
      { path: 'studio', lazy: () => import('./pages/StudioPage').then((m) => ({ Component: m.StudioPage })) },
      { path: 'contact', lazy: () => import('./pages/ContactPage').then((m) => ({ Component: m.ContactPage })) },
      { path: 'privacy', lazy: () => import('./pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
