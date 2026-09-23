import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { OrganizationSchema } from './components/Seo';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { ServiceDetail } from './pages/ServiceDetail';
import { Experience } from './pages/Experience';
import { Industries } from './pages/Industries';
import { LeadershipPage } from './pages/LeadershipPage';
import { Credentials } from './pages/Credentials';
import { Contact } from './pages/Contact';
import { RequestAQuote } from './pages/RequestAQuote';
import { RequestService } from './pages/RequestService';
import { EnvironmentalManagement } from './pages/EnvironmentalManagement';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminEnquiries } from './pages/admin/AdminEnquiries';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <OrganizationSchema />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/leadership" element={<LeadershipPage />} />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/request-a-quote" element={<RequestAQuote />} />
          <Route path="/request-service" element={<RequestService />} />
          {/* Canonical per docs/DECISIONS.md Decision 2 — consistent with the other four
              /services/<slug> pages. Old path kept as a redirect, not removed, so existing
              links/bookmarks/search results still resolve. */}
          <Route path="/services/environmental" element={<EnvironmentalManagement />} />
          <Route path="/environmental-management" element={<Navigate to="/services/environmental" replace />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Structurally separate layout tree per docs/FRONTEND_ARCHITECTURE.md — no public
            Navbar/Footer/WhatsApp button. Auth is enforced server-side per request by each
            /api/admin/* endpoint (docs/SECURITY_ARCHITECTURE.md Finding 1.1), not by this router. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminEnquiries />} />
        </Route>
      </Routes>
    </BrowserRouter>);

}
