import { Link } from 'react-router-dom';
import { Container } from './Container';
import { company } from '../data/company';
import { services } from '../data/services';

const companyLinks = [
{ label: 'About', to: '/about' },
{ label: 'Experience', to: '/experience' },
{ label: 'Leadership', to: '/leadership' },
{ label: 'Contact', to: '/contact' },
{ label: 'Request a Quote', to: '/request-a-quote' },
{ label: 'Request a Service', to: '/request-service' }];


export function Footer() {
  return (
    <footer className="bg-ink-900 text-white">
      <Container className="py-16 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr] lg:gap-10">
          <div>
            <Link to="/" className="flex items-center gap-3 leading-none" aria-label="Kamosa (Pty) Ltd — home">
              <img
                src="/logo.jpg"
                alt="Kamosa logo"
                className="h-16 w-16 rounded-sm object-cover ring-1 ring-white/10"
              />
              <span className="flex flex-col">
                <span className="font-display text-xl font-extrabold tracking-tight text-white">KAMOSA</span>
                <span className="mt-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.22em] text-gold">
                  (Pty) Ltd
                </span>
              </span>
            </Link>
            <p className="mt-6 max-w-xs text-[0.9375rem] leading-relaxed text-white/60">
              {company.tagline}.
            </p>
          </div>

          <nav aria-labelledby="footer-company">
            <h2 id="footer-company" className="font-display text-eyebrow font-semibold uppercase text-gold">
              Company
            </h2>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) =>
              <li key={link.to}>
                  <Link
                  to={link.to}
                  className="text-[0.9375rem] text-white/70 transition-colors duration-200 hover:text-white">
                  
                    {link.label}
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-labelledby="footer-services">
            <h2 id="footer-services" className="font-display text-eyebrow font-semibold uppercase text-gold">
              Services
            </h2>
            <ul className="mt-5 space-y-3">
              {services.map((service) =>
              <li key={service.slug}>
                  <Link
                  to={`/services/${service.slug}`}
                  className="text-[0.9375rem] text-white/70 transition-colors duration-200 hover:text-white">
                  
                    {service.title}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/services/environmental"
                  className="text-[0.9375rem] text-white/70 transition-colors duration-200 hover:text-white">
                  
                  Environmental Management
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-eyebrow font-semibold uppercase text-gold">Contact</h2>
            <ul className="mt-5 space-y-3 text-[0.9375rem] text-white/70">
              <li>
                <a href={company.phoneHref} className="transition-colors duration-200 hover:text-white">
                  {company.phone}
                </a>
              </li>
              <li>
                <a href={company.emailHref} className="break-all transition-colors duration-200 hover:text-white">
                  {company.email}
                </a>
              </li>
              <li>{company.operatingArea}</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1 text-[0.8125rem] text-white/50 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
            <span>© {new Date().getFullYear()} Kamosa (Pty) Ltd. All Rights Reserved.</span>
            <span>Reg. {company.registration}</span>
            <span>CSD {company.csd}</span>
          </div>
          <div className="flex items-center gap-6 text-[0.8125rem]">
            <Link to="/privacy" className="text-white/60 transition-colors duration-200 hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/60 transition-colors duration-200 hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>);

}