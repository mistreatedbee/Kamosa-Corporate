import React from 'react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonLink } from './Button';

export function AboutSection() {
  return (
    <section className="kamosa-section bg-white" aria-labelledby="about-heading">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <Reveal className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-cream">
              <img
                src="/6928b7ab-9299-4e7b-acb4-97116f4c86bf.jpg"
                alt="Kamosa consultants reviewing safety and management system documentation with a client on site"
                loading="lazy"
                className="h-full w-full object-cover" />
              
            </div>
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -right-5 hidden h-24 w-24 border-b-2 border-r-2 border-gold lg:block" />
            
          </Reveal>

          <div>
            <p className="mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-brand-600">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              Who We Are
            </p>
            <Reveal>
              <h2 id="about-heading" className="text-display-md text-balance text-ink-900">
                Integrated business solutions built around your operational reality.
              </h2>
            </Reveal>

            <Reveal index={1} className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-muted">
              <p>
                Kamosa (Pty) Ltd is an integrated business solutions company dedicated to helping organisations improve
                operational performance, strengthen compliance, manage business risk, and achieve sustainable growth.
              </p>
              <p>
                Our services are designed to support businesses throughout their operational journey by providing
                practical consulting, procurement, compliance, and support solutions tailored to each client&rsquo;s
                unique requirements.
              </p>
            </Reveal>

            <Reveal index={2} className="mt-10 grid gap-x-10 gap-y-6 border-t border-hairline pt-8 sm:grid-cols-2">
              <div>
                <p className="font-display text-sm font-semibold text-ink-900">Operating area</p>
                <p className="mt-1.5 text-[0.9375rem] text-muted">Republic of South Africa</p>
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-ink-900">Core disciplines</p>
                <p className="mt-1.5 text-[0.9375rem] text-muted">
                  Health &amp; safety, consulting, procurement, training
                </p>
              </div>
            </Reveal>

            <Reveal index={3} className="mt-10">
              <ButtonLink to="/about" variant="text">
                Discover Kamosa
              </ButtonLink>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>);

}