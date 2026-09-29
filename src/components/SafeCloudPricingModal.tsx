import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CheckIcon, XIcon } from 'lucide-react';
import { safeCloudPlans, sheqConsulting } from '../data/safecloud';
import type { SafeCloudPlan } from '../types/content';

interface SafeCloudPricingModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Same dialog pattern as MobileMenu.tsx (role="dialog", Escape-to-close, body scroll lock,
 * framer-motion with prefers-reduced-motion respected) — extended with a backdrop and initial
 * focus on the close button, since this is a content dialog rather than a full-screen nav overlay.
 */
export function SafeCloudPricingModal({ open, onClose }: SafeCloudPricingModalProps) {
  const reduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    closeButtonRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <motion.div
            aria-hidden="true"
            className="fixed inset-0 bg-ink-900/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose} />

          <div className="flex min-h-full items-start justify-center p-4 py-10 sm:p-6 sm:py-16">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="safecloud-pricing-heading"
              className="relative w-full max-w-5xl bg-white p-6 shadow-lift sm:p-10"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close pricing"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-sm text-muted transition-colors duration-200 hover:bg-cream hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                <XIcon className="h-5 w-5" aria-hidden={true} />
              </button>

              <p className="font-display text-eyebrow font-semibold uppercase tracking-[0.18em] text-brand-600">
                SafeCloud Africa
              </p>
              <h2 id="safecloud-pricing-heading" className="mt-3 font-display text-display-sm text-balance text-ink-900">
                Pricing built around your headcount.
              </h2>
              <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
                Choose the plan that matches your organisation's size. Every plan links through to SafeCloud Africa's
                own registration.
              </p>

              <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {safeCloudPlans.map((plan) => (
                  <PlanCard key={plan.name} plan={plan} />
                ))}
              </div>

              <div className="mt-10 border-t border-hairline pt-8">
                <div className="border border-hairline bg-cream p-6 sm:p-8">
                  <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-brand-600">
                    Consulting
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink-900">{sheqConsulting.title}</h3>
                  <p className="mt-2 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
                    {sheqConsulting.description}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                    <p className="font-display text-2xl font-bold text-ink-900">
                      {sheqConsulting.rate}
                      <span className="text-sm font-medium text-muted">{sheqConsulting.rateUnit}</span>
                    </p>
                    <a
                      href={sheqConsulting.mailto}
                      className="inline-flex items-center justify-center rounded-sm bg-brand-600 px-5 py-2.5 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
                      {sheqConsulting.cta}
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function PlanCard({ plan }: { plan: SafeCloudPlan }) {
  const href = plan.mailto ?? plan.url ?? '#';
  const isExternal = !plan.mailto;

  return (
    <div
      className={`relative flex h-full flex-col border p-6 ${
      plan.mostPopular ? 'border-2 border-brand-600 bg-white' : 'border-hairline bg-white'}`
      }>
      {plan.mostPopular ? (
        <span className="absolute -top-3 left-6 rounded-sm bg-brand-600 px-2.5 py-1 font-display text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-white">
          Most Popular
        </span>
      ) : null}

      <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ink-900">{plan.name}</p>
      <p className="mt-1 text-[0.8125rem] text-muted">{plan.employees}</p>

      <p className="mt-4 font-display text-3xl font-bold text-ink-900">
        {plan.price}
        <span className="text-sm font-medium text-muted"> {plan.period}</span>
      </p>

      <p className="mt-3 text-[0.875rem] leading-relaxed text-muted">{plan.description}</p>

      <ul className="mt-5 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-[0.8125rem] leading-snug text-ink-900/85">
            <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden={true} />
            {feature}
          </li>
        ))}
      </ul>

      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className={`mt-auto inline-flex items-center justify-center rounded-sm px-4 py-2.5 font-display text-[0.8125rem] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
        plan.mostPopular ?
        'bg-brand-600 text-white hover:bg-ink-700' :
        'border border-hairline text-ink-900 hover:border-ink-900 hover:bg-cream'}`
        }>
        {plan.cta}
      </a>
    </div>
  );
}
