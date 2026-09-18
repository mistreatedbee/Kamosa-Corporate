import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonAnchor, ButtonLink } from './Button';
import { company } from '../data/company';

export function CTASection() {
  return (
    <section className="bg-ink-900" aria-labelledby="cta-heading">
      <Container className="py-16 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
          <Reveal>
            <span aria-hidden="true" className="mb-8 block h-px w-16 bg-gold" />
            <h2 id="cta-heading" className="text-display-md text-balance text-white">
              Let&rsquo;s build safer, stronger and more compliant operations.
            </h2>
          </Reveal>
          <Reveal index={1}>
            <p className="max-w-prose text-[1.0625rem] leading-relaxed text-white/70">
              Whether you require professional consulting, compliance support, procurement solutions, or business
              advisory services, Kamosa is ready to partner with your organisation.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <ButtonLink to="/contact" variant="secondary">
                Send an Enquiry
              </ButtonLink>
              <ButtonAnchor href={company.phoneHref} variant="outline" inverted withArrow={false}>
                Call {company.phone}
              </ButtonAnchor>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>);

}