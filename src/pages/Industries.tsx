import { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { ButtonLink } from '../components/Button';
import { industries } from '../data/industries';

export function Industries() {
  const [activeSlug, setActiveSlug] = useState(industries[0].slug ?? industries[0].name);
  const active = industries.find((industry) => (industry.slug ?? industry.name) === activeSlug) ?? industries[0];

  return (
    <>
      <Seo
        title="Industries We Serve | Kamosa (Pty) Ltd"
        description="Kamosa (Pty) Ltd supports organisations across mining, construction, energy, manufacturing, transport, government and commercial sectors." />

      <PageHeader
        eyebrow="Industries"
        title="Experience across demanding sectors."
        body="Select a sector to see the services and experience relevant to your operating environment."
        crumbs={[{ label: 'Industries' }]} />

      <section className="kamosa-section bg-white" aria-label="Industry selector">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:gap-16">
            <Reveal>
              <div role="tablist" aria-label="Select an industry" className="flex flex-col gap-1 border border-hairline">
                {industries.map((industry) => {
                  const slug = industry.slug ?? industry.name;
                  const isActive = slug === activeSlug;
                  return (
                    <button
                      key={slug}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      id={`industry-tab-${slug}`}
                      aria-controls={`industry-panel-${slug}`}
                      onClick={() => setActiveSlug(slug)}
                      className={`flex items-center justify-between gap-3 border-b border-hairline px-5 py-4 text-left font-display text-[0.9375rem] font-semibold transition-colors duration-200 last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-600 ${
                      isActive ? 'bg-ink-900 text-white' : 'bg-white text-ink-900 hover:bg-cream'}`
                      }>
                      {industry.name}
                    </button>);

                })}
              </div>
            </Reveal>

            <Reveal index={1}>
              <div
                role="tabpanel"
                id={`industry-panel-${activeSlug}`}
                aria-labelledby={`industry-tab-${activeSlug}`}
                tabIndex={0}>
                <div className="overflow-hidden border border-hairline">
                  <img
                    src={active.image}
                    alt={active.imageAlt}
                    className="h-56 w-full object-cover sm:h-72" />
                </div>

                <h2 className="mt-8 font-display text-display-sm text-balance text-ink-900">{active.name}</h2>
                <p className="mt-4 max-w-prose text-[1.0625rem] leading-relaxed text-muted">
                  {active.overview ?? active.description}
                </p>

                {active.noConfirmedTrackRecord && active.disclosureStatement ? (
                  <div className="mt-6 flex gap-3 border border-hairline bg-cream p-4 text-[0.875rem] leading-relaxed text-ink-900">
                    <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden={true} />
                    <p>{active.disclosureStatement}</p>
                  </div>
                ) : null}

                {active.servicesRelevant && active.servicesRelevant.length > 0 ? (
                  <div className="mt-8 border-t border-hairline pt-6">
                    <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                      Relevant services
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {active.servicesRelevant.map((item) => (
                        <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
                          <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-8">
                  <ButtonLink to="/request-a-quote">Request a Quote</ButtonLink>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
