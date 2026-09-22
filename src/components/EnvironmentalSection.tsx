import { LeafIcon } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { environmentalCapabilities } from '../data/about';

export function EnvironmentalSection() {
  return (
    <section className="bg-white pb-[var(--kamosa-section-y)]" aria-labelledby="environmental-heading">
      <Container>
        <Reveal className="border-l-2 border-gold bg-cream p-8 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="flex items-center gap-2.5 font-display text-eyebrow font-semibold uppercase text-brand-600">
                <LeafIcon className="h-4 w-4" aria-hidden="true" />
                Associate Capability
              </p>
              <h2 id="environmental-heading" className="mt-5 text-display-sm text-balance text-ink-900">
                Environmental Management &amp; Compliance
              </h2>
              <p className="mt-6 max-w-prose text-[0.9375rem] leading-relaxed text-muted">
                This capability is provided through Kamosa&rsquo;s associate network rather than by in-house staff.
                Associates are engaged on a project basis, which lets us extend environmental support to clients
                without overstating our internal team.
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:self-center">
              {environmentalCapabilities.map((item) =>
              <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug text-ink-900/85">
                  <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                  {item}
                </li>
              )}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>);

}