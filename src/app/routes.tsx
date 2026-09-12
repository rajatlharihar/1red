import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { StudioPage } from './pages/StudioPage';
import { ContactPage } from './pages/ContactPage';
import { WorkDetailPage } from './pages/WorkDetailPage';
import { PrivacyPage } from './pages/PrivacyPage';

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
      { path: 'work/:slug', Component: WorkDetailPage },
      { path: 'services', Component: ServicesPage },
      { path: 'studio', Component: StudioPage },
      { path: 'contact', Component: ContactPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
