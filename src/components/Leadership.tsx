import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonLink } from './Button';
import { leadership } from '../data/about';

interface LeadershipProps {
  condensed?: boolean;
}

function getMonogram(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

export function Leadership({ condensed = false }: LeadershipProps) {
  return (
    <section className="kamosa-section bg-white" aria-labelledby="leadership-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <Reveal>
            {/* No portrait supplied yet — a monogram treatment stands in until one is provided. */}
            <figure className="m-0">
              <div className="relative flex aspect-[4/5] w-full flex-col items-center justify-center overflow-hidden bg-ink-900 px-6 text-center">
                <span aria-hidden="true" className="absolute inset-x-8 top-8 h-px bg-white/10" />
                <span aria-hidden="true" className="absolute inset-x-8 bottom-8 h-px bg-white/10" />
                <span className="font-display text-7xl font-extrabold tracking-tight text-gold">
                  {getMonogram(leadership.name)}
                </span>
                <p className="mt-7 font-display text-lg font-bold text-white">{leadership.name}</p>
                <p className="mt-1.5 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white/60">
                  {leadership.title}
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
                Led by a registered professional with real site experience.
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