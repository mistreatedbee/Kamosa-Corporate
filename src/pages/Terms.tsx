import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { company } from '../data/company';

export function Terms() {
  return (
    <>
      <Seo
        title="Terms of Use | Kamosa (Pty) Ltd"
        description="Terms governing the use of the Kamosa (Pty) Ltd website." />
      
      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        body="Terms governing the use of this website and the information published on it."
        crumbs={[{ label: 'Terms' }]} />
      

      <section className="kamosa-section bg-white">
        <Container>
          {/* TODO: these terms must be reviewed and approved by the client before publication. */}
          <div className="max-w-prose space-y-8 text-[1.0625rem] leading-relaxed text-muted">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Information on this website</h2>
              <p className="mt-3">
                The content of this website is provided for general information about the services offered by{' '}
                {company.name} (registration {company.registration}). It does not constitute professional advice and
                should not be relied upon in place of a formal engagement.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Scope of services</h2>
              <p className="mt-3">
                Services are delivered subject to a written scope of work agreed with each client. Descriptions on this
                website summarise our capabilities and do not form an offer or a guarantee of any specific outcome.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Intellectual property</h2>
              <p className="mt-3">
                The Kamosa name, marks and the content of this website remain the property of {company.name} and may
                not be reproduced without written permission.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Enquiries</h2>
              <p className="mt-3">
                Questions about these terms may be directed to{' '}
                <a href={company.emailHref} className="font-medium text-brand-600 underline underline-offset-2">
                  {company.email}
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>);

}