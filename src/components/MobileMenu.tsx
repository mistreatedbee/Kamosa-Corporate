import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { company, navLinks } from '../data/company';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ?
      <motion.div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        className="fixed inset-0 z-50 flex flex-col bg-ink-900 lg:hidden"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
        
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8">
            <Link to="/" onClick={onClose} className="font-display text-base font-extrabold leading-none text-white">
              KAMOSA
              <span className="ml-1.5 font-sans text-[0.625rem] font-normal tracking-[0.2em] text-gold">
                (PTY) LTD
              </span>
            </Link>
            <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-11 w-11 items-center justify-center text-white/80 transition-colors duration-200 hover:text-gold">
            
              <XIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto px-5 py-8 sm:px-8">
            <ul className="flex flex-col">
              {navLinks.map((link, i) =>
            <li key={link.to} className="border-b border-white/10">
                  <Link
                to={link.to}
                onClick={onClose}
                className="flex items-baseline gap-4 py-5 font-display text-2xl font-bold text-white transition-colors duration-200 hover:text-gold">
                
                    <span aria-hidden="true" className="font-sans text-xs font-normal text-gold/70">
                      0{i + 1}
                    </span>
                    {link.label}
                  </Link>
                </li>
            )}
            </ul>
          </nav>

          <div className="border-t border-white/10 px-5 py-6 sm:px-8">
            <Link
            to="/contact"
            onClick={onClose}
            className="group flex w-full items-center justify-center gap-2.5 rounded-sm bg-gold px-6 py-4 font-display text-base font-semibold text-ink-900 transition-colors duration-200 hover:bg-gold-soft">
            
              Request an Enquiry
              <ArrowRightIcon
              className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-1"
              aria-hidden="true" />
            
            </Link>
            <div className="mt-5 flex flex-col gap-1 text-sm text-white/60">
              <a href={company.phoneHref} className="transition-colors duration-200 hover:text-white">
                {company.phone}
              </a>
              <a href={company.emailHref} className="transition-colors duration-200 hover:text-white">
                {company.email}
              </a>
            </div>
          </div>
        </motion.div> :
      null}
    </AnimatePresence>);

}