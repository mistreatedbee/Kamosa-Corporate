import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, Loader2Icon, MailIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { ButtonAnchor } from '../components/Button';
import { JobApplicationForm } from '../components/JobApplicationForm';
import { JobPostingPreview } from '../components/careers/JobPostingPreview';
import { fetchOpenJobPostings } from '../utils/careers';
import type { JobPosting } from '../types/careers';

export function CareerDetail() {
  const { id } = useParams<{ id: string }>();
  const [postings, setPostings] = useState<JobPosting[] | null>(null);

  useEffect(() => {
    fetchOpenJobPostings().then(setPostings);
  }, []);

  const posting = postings?.find((p) => p.id === id) ?? null;

  if (postings === null) {
    return (
      <Container className="flex items-center gap-2 py-24 text-[0.9375rem] text-muted">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading…
      </Container>
    );
  }

  if (!posting) {
    return (
      <>
        <Seo title="Role not found | Kamosa Careers" description="This role is no longer available." noindex />
        <Container className="py-24 text-center">
          <p className="font-display text-lg font-bold text-ink-900">This role isn't available anymore.</p>
          <p className="mt-2 text-[0.9375rem] text-muted">It may have closed or been filled.</p>
          <Link to="/careers" className="mt-6 inline-block text-[0.875rem] font-semibold text-brand-600 hover:underline">
            ← Back to all openings
          </Link>
        </Container>
      </>
    );
  }

  return (
    <>
      <Seo title={`${posting.title} | Kamosa Careers`} description={posting.summary} />

      <PageHeader
        eyebrow={posting.category || 'Careers'}
        title={posting.title}
        crumbs={[{ label: 'Careers', to: '/careers' }, { label: posting.title }]} />

      <section className="kamosa-section bg-white">
        <Container>
          <Link to="/careers" className="mb-8 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted transition-colors duration-200 hover:text-ink-900">
            <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden={true} />
            Back to all openings
          </Link>

          <div className="max-w-3xl border border-hairline bg-white">
            <div className="p-6 sm:p-8">
              <Reveal>
                <JobPostingPreview posting={posting} />
              </Reveal>
            </div>

            {posting.application_method === 'website' ? (
              <JobApplicationForm posting={posting} />
            ) : posting.application_method === 'email' ? (
              <div className="border-t border-hairline bg-cream/50 p-6 sm:p-8">
                <h3 className="font-display text-base font-bold text-ink-900">How to apply</h3>
                <p className="mt-2 text-[0.9375rem] text-muted">Send your application by email.</p>
                <ButtonAnchor href={`mailto:${posting.application_email}?subject=${encodeURIComponent(`Application: ${posting.title}`)}`} variant="primary" withArrow={false} className="mt-4">
                  <span className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" aria-hidden={true} />
                    Email {posting.application_email}
                  </span>
                </ButtonAnchor>
              </div>
            ) : (
              <div className="border-t border-hairline bg-cream/50 p-6 sm:p-8">
                <h3 className="font-display text-base font-bold text-ink-900">How to apply</h3>
                <p className="mt-2 text-[0.9375rem] text-muted">Applications for this role are handled externally.</p>
                {posting.application_url ? (
                  <ButtonAnchor href={posting.application_url} variant="primary" className="mt-4">
                    Apply on external site
                  </ButtonAnchor>
                ) : null}
              </div>
            )}
          </div>
        </Container>
      </section>
    </>
  );
}
