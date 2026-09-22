import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRightIcon, MenuIcon } from 'lucide-react';
import { Container } from './Container';
import { MobileMenu } from './MobileMenu';
import { navLinks } from '../data/company';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-ink-900 focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:text-white">
        
        Skip to content
      </a>

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ease-editorial ${
        scrolled ?
        'border-b border-hairline bg-white/95 shadow-nav backdrop-blur-md' :
        'border-b border-transparent bg-white'}`
        }>
        
        <Container className="flex h-[76px] items-center justify-between gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-3 leading-none" aria-label="Kamosa (Pty) Ltd — home">
            <img
              src="/logo.jpg"
              alt="Kamosa logo"
              className="h-14 w-14 rounded-sm object-cover ring-1 ring-black/5"
            />
            <span className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-ink-900">KAMOSA</span>
              <span className="mt-0.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.22em] text-muted">
                (Pty) Ltd
              </span>
            </span>
          </Link>

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {navLinks.map((link) =>
              <li key={link.to}>
                  <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                  `relative py-2 font-display text-[0.9375rem] font-medium transition-colors duration-200 ${
                  isActive ? 'text-brand-600' : 'text-ink-900 hover:text-brand-600'}`

                  }>
                  
                    {({ isActive }) =>
                  <>
                        {link.label}
                        <span
                      aria-hidden="true"
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-gold transition-transform duration-200 ease-editorial ${
                      isActive ? 'scale-x-100' : 'scale-x-0'}`
                      } />
                    
                      </>
                  }
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/contact"
              className="group hidden items-center gap-2 rounded-sm bg-brand-600 px-5 py-3 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-900 sm:inline-flex">
              
              Request an Enquiry
              <ArrowRightIcon
                className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-1"
                aria-hidden="true" />
              
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="-mr-2 flex h-12 w-12 items-center justify-center text-ink-900 transition-colors duration-200 hover:text-brand-600 lg:hidden">
              
              <MenuIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </Container>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>);

}