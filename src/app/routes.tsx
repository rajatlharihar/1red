import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { StudioPage } from './pages/StudioPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPage } from './pages/PrivacyPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'work', element: <Navigate to="/" replace /> },
      { path: 'work/:slug', element: <Navigate to="/" replace /> },
      { path: 'services', Component: ServicesPage },
      { path: 'studio', Component: StudioPage },
      { path: 'contact', Component: ContactPage },
      { path: 'privacy', Component: PrivacyPage },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
