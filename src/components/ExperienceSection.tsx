import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonLink } from './Button';
import { experienceRecords } from '../data/experience';

interface ExperienceSectionProps {
  /** Home page shows a condensed set with a link through to the full record. */
  condensed?: boolean;
}

export function ExperienceSection({ condensed = false }: ExperienceSectionProps) {
  const [lead, ...rest] = experienceRecords;
  const records = condensed ? rest.slice(0, 3) : rest;

  return (
    <section className="kamosa-section bg-white" aria-labelledby="experience-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-brand-600">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              Track Record
            </p>
            <Reveal>
              <h2 id="experience-heading" className="text-display-md text-balance text-ink-900">
                A proven track record in high-risk operations.
              </h2>
            </Reveal>
            <Reveal index={1}>
              <p className="mt-6 max-w-prose text-[1.0625rem] leading-relaxed text-muted">
                Six-plus years of multi-sector SHE experience, built on sites where production pressure, contractor
                complexity and statutory obligation meet.
              </p>
            </Reveal>
            {condensed ?
            <Reveal index={2} className="mt-9">
                <ButtonLink to="/experience" variant="text">
                  View full track record
                </ButtonLink>
              </Reveal> :
            null}
          </div>

          <div>
            <Reveal className="border border-hairline bg-cream p-8 sm:p-10">
              <p className="font-display text-eyebrow font-semibold uppercase text-brand-600">{lead.sector}</p>
              <h3 className="mt-5 font-display text-2xl font-bold leading-snug tracking-tight text-ink-900">
                {lead.headline}
              </h3>
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted">{lead.body}</p>
              <ul className="mt-7 flex flex-wrap gap-2">
                {['Medupi', 'Lethabo', 'Matla'].map((station) =>
                <li
                  key={station}
                  className="border border-ink-900/15 px-3 py-1.5 font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-ink-900">
                  
                    {station}
                  </li>
                )}
              </ul>
            </Reveal>

            <ul className="mt-10 divide-y divide-hairline border-t border-hairline">
              {records.map((record, i) =>
              <Reveal as="li" key={record.sector} index={i} className="py-8">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-8">
                    <p className="font-display text-eyebrow font-semibold uppercase text-gold sm:w-44 sm:shrink-0">
                      {record.sector}
                    </p>
                    <div>
                      <h3 className="font-display text-lg font-semibold leading-snug text-ink-900">
                        {record.headline}
                      </h3>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{record.body}</p>
                      {!condensed ?
                    <ul className="mt-4 space-y-2">
                          {record.points.map((point) =>
                      <li key={point} className="flex gap-2.5 text-[0.875rem] leading-snug text-ink-900/80">
                              <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                              {point}
                            </li>
                      )}
                        </ul> :
                    null}
                    </div>
                  </div>
                </Reveal>
              )}
            </ul>
          </div>
        </div>
      </Container>
    </section>);

}