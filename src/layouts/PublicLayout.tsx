import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { StickyWhatsAppButton } from '../components/StickyWhatsAppButton';
import { CompanyProvider } from '../contexts/CompanyContext';

export function PublicLayout() {
  return (
    <CompanyProvider>
      <div className="flex min-h-screen w-full flex-col bg-white">
        <Navbar />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <StickyWhatsAppButton />
      </div>
    </CompanyProvider>
  );
}
