import { useEffect, useState } from 'react';
import { BriefcaseIcon } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { ButtonLink } from './Button';
import { fetchOpenJobPostings } from '../utils/careers';

export function CareersTeaser() {
  const [openCount, setOpenCount] = useState<number | null>(null);

  useEffect(() => {
    fetchOpenJobPostings().then((postings) => setOpenCount(postings.length));
  }, []);

  return (
    <section className="kamosa-section bg-cream" aria-labelledby="careers-teaser-heading">
      <Container>
        <Reveal>
          <div className="flex flex-col items-center gap-6 border border-hairline bg-white px-8 py-14 text-center sm:px-14">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600/10">
              <BriefcaseIcon className="h-5 w-5 text-brand-600" aria-hidden={true} />
            </span>
            <div>
              <h2 id="careers-teaser-heading" className="font-display text-display-sm text-balance text-ink-900">
                Join our team.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                {openCount && openCount > 0
                  ? `We currently have ${openCount} open position${openCount === 1 ? '' : 's'}. Apply online with your CV in a few minutes.`
                  : 'We’re always happy to hear from good people. View current openings and apply with your CV.'}
              </p>
            </div>
            <ButtonLink to="/careers" variant="primary">
              View Careers
            </ButtonLink>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
