import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRightIcon,
  ClipboardCheckIcon,
  CloudIcon,
  HeartPulseIcon,
  UserCheckIcon
} from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { SectionHeader } from './SectionHeader';
import { SafeCloudPricingModal } from './SafeCloudPricingModal';
import { additionalServices } from '../data/additionalServices';
import type { AdditionalService } from '../types/content';

const ICONS: Record<AdditionalService['icon'], React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>> = {
  wellness: HeartPulseIcon,
  safecloud: CloudIcon,
  mentoring: UserCheckIcon,
  sheq: ClipboardCheckIcon
};

// Matches ServiceCard.tsx's existing text-style CTA exactly (font-display text-sm font-semibold
// text-brand-600 + ArrowUpRightIcon with the same hover-translate), so these cards read as the same
// family as the four core service cards immediately above them on /services.
const ctaClass =
'group/cta inline-flex items-center gap-2 font-display text-sm font-semibold text-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function CtaArrow() {
  return (
    <ArrowUpRightIcon
      className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5"
      aria-hidden={true} />
  );
}

export function AdditionalServices() {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <section className="kamosa-section bg-cream" aria-labelledby="additional-services-heading">
      <Container>
        <SectionHeader
          eyebrow="Extended Capability"
          titleId="additional-services-heading"
          title="Additional support for your operation."
          body="Beyond our four core service lines, Kamosa connects clients with specialised support and a digital compliance platform built for South African workplaces."
          className="mb-14" />

        <div className="grid gap-6 md:grid-cols-2">
          {additionalServices.map((service, i) => {
            const Icon = ICONS[service.icon];
            return (
              <Reveal key={service.slug} index={i} className="h-full">
                <div className="group flex h-full flex-col border border-hairline bg-white p-8 transition-[transform,border-color,box-shadow] duration-200 ease-editorial hover:-translate-y-1 hover:border-ink-900/25 hover:shadow-lift">
                  <span className="flex h-12 w-12 items-center justify-center rounded-sm bg-cream text-brand-600">
                    <Icon className="h-6 w-6" aria-hidden={true} />
                  </span>
                  <h3 className="mt-7 font-display text-xl font-bold leading-snug tracking-tight text-ink-900">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{service.description}</p>

                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 pt-8">
                    {service.externalUrl ? (
                      <a href={service.externalUrl} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                        {service.ctaLabel}
                        <CtaArrow />
                      </a>
                    ) : (
                      <Link to={service.to ?? '/contact'} className={ctaClass}>
                        {service.ctaLabel}
                        <CtaArrow />
                      </Link>
                    )}

                    {service.secondaryCtaLabel ? (
                      <button
                        type="button"
                        onClick={() => setPricingOpen(true)}
                        className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-900 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                        {service.secondaryCtaLabel}
                      </button>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>

      <SafeCloudPricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </section>
  );
}
