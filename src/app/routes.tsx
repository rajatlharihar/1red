import { createBrowserRouter, Navigate, useParams } from 'react-router';
import { Layout } from './components/Layout';
import { RouteError } from './components/RouteError';

/** Old project URLs (/work/<slug>, live until 2026-09-30) keep working. */
function OldCaseStudy() {
  const { slug } = useParams();
  return <Navigate to={`/case-studies/${slug}`} replace />;
}

// Every other route is lazy-loaded — the homepage already carries the
// weight of two <Canvas> scenes, so nothing else should ride in on that
// same initial bundle. `lazy` is react-router's own route-level code
// splitting: no manual Suspense/React.lazy boilerplate needed.
//
// The IA (2026-09-30, after a study of agency sites): Work is the
// filterable showcase of every piece; Case studies are the deep project
// pages; The Box (was /studio) is how we work; About is who, what and why.
export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: RouteError,
    children: [
      // Lazy like every other route, so /work, /contact and the rest never
      // download three.js and the hero; home fetches it in parallel at start.
      { index: true, lazy: () => import('./pages/HomePage').then((m) => ({ Component: m.HomePage })) },
      { path: 'work', lazy: () => import('./pages/WorksPage').then((m) => ({ Component: m.WorksPage })) },
      { path: 'work/:slug', Component: OldCaseStudy },
      { path: 'case-studies', lazy: () => import('./pages/CaseStudiesPage').then((m) => ({ Component: m.CaseStudiesPage })) },
      { path: 'case-studies/:slug', lazy: () => import('./pages/WorkDetailPage').then((m) => ({ Component: m.WorkDetailPage })) },
      { path: 'the-box', lazy: () => import('./pages/StudioPage').then((m) => ({ Component: m.StudioPage })) },
      { path: 'studio', element: <Navigate to="/the-box" replace /> },
      { path: 'about', lazy: () => import('./pages/AboutPage').then((m) => ({ Component: m.AboutPage })) },
      { path: 'contact', lazy: () => import('./pages/ContactPage').then((m) => ({ Component: m.ContactPage })) },
      { path: 'privacy', lazy: () => import('./pages/PrivacyPage').then((m) => ({ Component: m.PrivacyPage })) },
      { path: '*', lazy: () => import('./pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
]);
