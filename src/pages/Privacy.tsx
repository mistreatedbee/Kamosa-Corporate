import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { company } from '../data/company';

export function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy | Kamosa (Pty) Ltd"
        description="How Kamosa (Pty) Ltd handles personal information submitted through this website." />
      
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        body="How Kamosa (Pty) Ltd handles personal information submitted through this website."
        crumbs={[{ label: 'Privacy Policy' }]} />
      

      <section className="kamosa-section bg-white">
        <Container>
          {/* TODO: this policy must be reviewed and approved by the client before publication. */}
          <div className="max-w-prose space-y-8 text-[1.0625rem] leading-relaxed text-muted">
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Information we collect</h2>
              <p className="mt-3">
                When you complete the enquiry form on this website we collect the name, company, email address,
                telephone number, service of interest and message that you provide. We do not collect this information
                for any purpose other than responding to your enquiry.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">How we use your information</h2>
              <p className="mt-3">
                Your information is used to respond to your enquiry, to prepare proposals or quotations where
                requested, and to maintain a record of our correspondence with you. We do not sell personal
                information.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Retention and access</h2>
              <p className="mt-3">
                Enquiry records are retained for as long as necessary to service the enquiry and to meet our record
                keeping obligations. You may request access to, correction of, or deletion of your personal
                information by contacting us.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink-900">Contact</h2>
              <p className="mt-3">
                Privacy queries may be directed to{' '}
                <a
                  href={company.emailHref}
                  className="font-medium text-brand-600 underline underline-offset-2">
                  
                  {company.email}
                </a>{' '}
                or{' '}
                <a href={company.phoneHref} className="font-medium text-brand-600 underline underline-offset-2">
                  {company.phone}
                </a>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>);

}