import { ShieldCheckIcon } from 'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { SectionHeader } from './SectionHeader';
import { credentials } from '../data/about';

export function Credentials() {
  return (
    <section className="kamosa-section bg-cream" aria-labelledby="credentials-heading">
      <Container>
        <SectionHeader
          eyebrow="Credentials"
          titleId="credentials-heading"
          title="Professional credentials that build confidence."
          body="Registration, ownership and professional standing that procurement and tender evaluation teams can verify."
          className="mb-14" />
        

        <ul className="grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
          {credentials.map((credential, i) =>
          <Reveal as="li" key={credential.label} index={i} className="bg-white p-7">
              <ShieldCheckIcon className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <h3 className="mt-6 font-display text-base font-semibold leading-snug text-ink-900">
                {credential.label}
              </h3>
              <p className="mt-2 text-[0.875rem] leading-snug text-muted">{credential.detail}</p>
            </Reveal>
          )}
        </ul>
      </Container>
    </section>);

}