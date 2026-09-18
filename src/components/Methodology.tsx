import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { SectionHeader } from './SectionHeader';
import { methodology } from '../data/about';

export function Methodology() {
  return (
    <section className="kamosa-section bg-white" aria-labelledby="methodology-heading">
      <Container>
        <SectionHeader
          eyebrow="How We Work"
          titleId="methodology-heading"
          title="A structured approach from discovery to improvement."
          body="Six stages that keep an engagement predictable — for your team, your contractors and your compliance record."
          className="mb-16" />
        

        {/* Desktop: horizontal timeline */}
        <ol className="hidden lg:grid lg:grid-cols-6">
          {methodology.map((stage, i) =>
          <Reveal as="li" key={stage.number} index={i} className="relative pr-6 pt-10">
              <span aria-hidden="true" className="absolute left-0 top-0 h-px w-full bg-hairline" />
              <span
              aria-hidden="true"
              className="absolute -top-[3px] left-0 h-[7px] w-[7px] rounded-full bg-gold" />
            
              <p className="font-display text-sm font-bold tracking-[0.12em] text-gold">{stage.number}</p>
              <h3 className="mt-4 font-display text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-ink-900">
                {stage.title}
              </h3>
              <p className="mt-4 text-[0.875rem] leading-relaxed text-muted">{stage.description}</p>
            </Reveal>
          )}
        </ol>

        {/* Mobile / tablet: vertical timeline */}
        <ol className="relative lg:hidden">
          <span aria-hidden="true" className="absolute bottom-2 left-[3px] top-2 w-px bg-hairline" />
          {methodology.map((stage, i) =>
          <Reveal as="li" key={stage.number} index={i} className="relative pb-9 pl-8 last:pb-0">
              <span aria-hidden="true" className="absolute left-0 top-2 h-[7px] w-[7px] rounded-full bg-gold" />
              <p className="font-display text-sm font-bold tracking-[0.12em] text-gold">{stage.number}</p>
              <h3 className="mt-2 font-display text-[0.8125rem] font-bold uppercase tracking-[0.14em] text-ink-900">
                {stage.title}
              </h3>
              <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-muted">{stage.description}</p>
            </Reveal>
          )}
        </ol>
      </Container>
    </section>);

}