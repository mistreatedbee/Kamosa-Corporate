import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { SectionHeader } from './SectionHeader';
import { ServiceCard } from './ServiceCard';
import { services } from '../data/services';

interface ServicesGridProps {
  /** Renders the section heading block. Set false when the page already has one. */
  withHeader?: boolean;
  background?: 'white' | 'cream';
}

export function ServicesGrid({ withHeader = true, background = 'white' }: ServicesGridProps) {
  const [featured, ...rest] = services;

  return (
    <section
      className={`kamosa-section ${background === 'cream' ? 'bg-cream' : 'bg-white'}`}
      aria-labelledby={withHeader ? 'services-heading' : undefined}>
      
      <Container>
        {withHeader ?
        <SectionHeader
          eyebrow="What We Do"
          titleId="services-heading"
          title="Professional solutions for complex operational environments."
          body="Four integrated service lines designed to help organisations meet legal obligations while improving day-to-day operational performance."
          className="mb-14" /> :

        null}

        <div className="space-y-6">
          <Reveal>
            <ServiceCard service={featured} featured />
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((service, i) =>
            <Reveal key={service.slug} index={i} className="h-full">
                <ServiceCard service={service} />
              </Reveal>
            )}
          </div>
        </div>
      </Container>
    </section>);

}