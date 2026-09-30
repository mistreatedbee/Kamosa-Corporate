import { useEffect, useState } from 'react';
import { BriefcaseIcon, ChevronDownIcon, ClockIcon, Loader2Icon, MapPinIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { JobApplicationForm } from '../components/JobApplicationForm';
import { fetchOpenJobPostings, type JobPosting } from '../utils/careers';
import { company } from '../data/company';

export function Careers() {
  const [postings, setPostings] = useState<JobPosting[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchOpenJobPostings().then(setPostings);
  }, []);

  return (
    <>
      <Seo
        title="Careers | Kamosa (Pty) Ltd"
        description="Join Kamosa (Pty) Ltd. View current openings and apply with your CV." />

      <PageHeader
        eyebrow="Careers"
        title="Build your career with Kamosa."
        body="We're a growing health, safety and compliance consultancy. Have a look at our current openings below."
        crumbs={[{ label: 'Careers' }]} />

      <section className="kamosa-section bg-white" aria-label="Current openings">
        <Container>
          {postings === null ? (
            <div className="flex items-center gap-2 py-16 text-[0.9375rem] text-muted">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
              Loading current openings…
            </div>
          ) : null}

          {postings && postings.length === 0 ? (
            <Reveal>
              <div className="border border-hairline bg-cream px-8 py-16 text-center">
                <BriefcaseIcon className="mx-auto h-8 w-8 text-brand-600/40" aria-hidden={true} />
                <p className="mt-5 font-display text-lg font-bold text-ink-900">No open positions right now</p>
                <p className="mx-auto mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  We don't have any vacancies at the moment, but we're always happy to hear from good people. Feel
                  free to email your CV to{' '}
                  <a href={company.emailHref} className="font-medium text-brand-600 hover:underline">
                    {company.email}
                  </a>{' '}
                  and we'll keep it on file.
                </p>
              </div>
            </Reveal>
          ) : null}

          {postings && postings.length > 0 ? (
            <div className="space-y-5">
              {postings.map((posting, index) => {
                const isExpanded = expandedId === posting.id;
                return (
                  <Reveal key={posting.id} index={index}>
                    <div className="border border-hairline bg-white">
                      <button
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === posting.id ? null : posting.id))}
                        aria-expanded={isExpanded}
                        className="flex w-full items-center justify-between gap-6 p-6 text-left sm:p-8">
                        <div>
                          <h2 className="font-display text-lg font-bold text-ink-900">{posting.title}</h2>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.8125rem] text-muted">
                            {posting.department ? <span>{posting.department}</span> : null}
                            <span className="flex items-center gap-1.5">
                              <MapPinIcon className="h-3.5 w-3.5" aria-hidden={true} />
                              {posting.location}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <ClockIcon className="h-3.5 w-3.5" aria-hidden={true} />
                              {posting.employment_type}
                            </span>
                          </div>
                          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">{posting.summary}</p>
                        </div>
                        <ChevronDownIcon
                          className={`h-5 w-5 shrink-0 text-ink-900 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden={true} />
                      </button>

                      {isExpanded ? (
                        <div className="border-t border-hairline px-6 pb-6 pt-6 sm:px-8">
                          {posting.responsibilities.length > 0 ? (
                            <div className="mb-6">
                              <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-ink-900">
                                Responsibilities
                              </h3>
                              <ul className="mt-3 space-y-2">
                                {posting.responsibilities.map((item) => (
                                  <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
                                    <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          {posting.requirements.length > 0 ? (
                            <div>
                              <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-ink-900">
                                Requirements
                              </h3>
                              <ul className="mt-3 space-y-2">
                                {posting.requirements.map((item) => (
                                  <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
                                    <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {isExpanded ? <JobApplicationForm jobPostingId={posting.id} jobTitle={posting.title} /> : null}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
