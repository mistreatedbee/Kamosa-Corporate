import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OrganizationSchema } from './components/Seo';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { ServiceDetail } from './pages/ServiceDetail';
import { Experience } from './pages/Experience';
import { LeadershipPage } from './pages/LeadershipPage';
import { Contact } from './pages/Contact';
import { EnvironmentalManagement } from './pages/EnvironmentalManagement';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { NotFound } from './pages/NotFound';

const ADMIN_STORAGE_KEY = 'kamosa-admin-auth';

function isAdminAuthenticated() {
  return typeof window !== 'undefined' && localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  return isAdminAuthenticated() ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function AdminLogout() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  return <Navigate to="/admin/login" replace />;
}

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
      <div className="flex min-h-screen w-full flex-col bg-white">
        <Navbar />
        <main id="main" className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/leadership" element={<LeadershipPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/environmental-management" element={<EnvironmentalManagement />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/logout" element={<AdminLogout />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>);

}