import React from 'react';
import { UserIcon } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonLink } from './Button';
import { leadership } from '../data/about';

interface LeadershipProps {
  condensed?: boolean;
}

export function Leadership({ condensed = false }: LeadershipProps) {
  return (
    <section className="kamosa-section bg-white" aria-labelledby="leadership-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <Reveal>
            {/* TODO: replace with the approved professional portrait once supplied by the client. */}
            <figure className="m-0">
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center border border-hairline bg-cream px-6 text-center">
                <UserIcon className="h-9 w-9 text-brand-600/40" aria-hidden="true" />
                <p className="mt-5 font-display text-sm font-semibold text-ink-900">{leadership.name}</p>
                <p className="mt-1 text-[0.8125rem] text-muted">{leadership.title}</p>
                <p className="mt-5 max-w-[16rem] text-[0.75rem] leading-relaxed text-muted/80">
                  Professional portrait to follow
                </p>
              </div>
            </figure>
          </Reveal>

          <div>
            <p className="mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-brand-600">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              Professional Leadership
            </p>
            <Reveal>
              <h2 id="leadership-heading" className="text-display-md text-balance text-ink-900">
                Experienced leadership. Practical industry knowledge.
              </h2>
            </Reveal>

            <Reveal index={1} className="mt-8">
              <p className="font-display text-lg font-bold text-ink-900">{leadership.name}</p>
              <p className="mt-1 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-gold">
                {leadership.title}
              </p>
              <p className="mt-6 max-w-prose text-[1.0625rem] leading-relaxed text-muted">{leadership.description}</p>
            </Reveal>

            <Reveal index={2} className="mt-10 grid gap-10 border-t border-hairline pt-8 sm:grid-cols-2">
              <div>
                <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                  Areas of expertise
                </h3>
                <ul className="mt-4 space-y-2">
                  {leadership.focusAreas.map((area) =>
                  <li key={area} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
                      <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                      {area}
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                  Credentials
                </h3>
                <ul className="mt-4 space-y-2">
                  {leadership.credentials.map((credential) =>
                  <li key={credential} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
                      <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                      {credential}
                    </li>
                  )}
                </ul>
              </div>
            </Reveal>

            {condensed ?
            <Reveal index={3} className="mt-10">
                <ButtonLink to="/leadership" variant="text">
                  More on our leadership
                </ButtonLink>
              </Reveal> :
            null}
          </div>
        </div>
      </Container>
    </section>);

}