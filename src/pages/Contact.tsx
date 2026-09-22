import { GlobeIcon, MailIcon, MapPinIcon, PhoneIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { ContactForm } from '../components/ContactForm';
import { company } from '../data/company';

export function Contact() {
  return (
    <>
      <Seo
        title="Contact | Kamosa (Pty) Ltd"
        description="Contact Kamosa (Pty) Ltd for health, safety and compliance, business consulting, procurement and training enquiries. Telephone 071 191 4744 or email info@kamosa.co.za." />
      
      <PageHeader
        eyebrow="Get in Touch"
        title="Let’s work together."
        body="Tell us what your operation needs and we will respond with a practical next step."
        crumbs={[{ label: 'Contact' }]} />
      

      <section className="kamosa-section bg-white" aria-label="Contact details and enquiry form">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal>
              <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                Contact details
              </h2>

              <div className="mt-6 border-t border-hairline pt-6">
                <p className="font-display text-lg font-bold text-ink-900">{company.name}</p>
                <p className="mt-3 text-[0.9375rem] text-muted">
                  {company.managingDirector}
                  <br />
                  Managing Director
                </p>
              </div>

              <ul className="mt-8 space-y-5">
                <li className="flex gap-4">
                  <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                      Telephone
                    </p>
                    <a
                      href={company.phoneHref}
                      className="mt-1 block text-[0.9375rem] text-ink-900 transition-colors duration-200 hover:text-brand-600">
                      
                      {company.phone}
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <MailIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                      Email
                    </p>
                    <a
                      href={company.emailHref}
                      className="mt-1 block break-all text-[0.9375rem] text-ink-900 transition-colors duration-200 hover:text-brand-600">
                      
                      {company.email}
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <GlobeIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                      Website
                    </p>
                    <a
                      href={company.websiteHref}
                      className="mt-1 block text-[0.9375rem] text-ink-900 transition-colors duration-200 hover:text-brand-600">
                      
                      {company.website}
                    </a>
                  </div>
                </li>
                <li className="flex gap-4">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                      Operating area
                    </p>
                    <p className="mt-1 text-[0.9375rem] text-ink-900">{company.operatingArea}</p>
                  </div>
                </li>
              </ul>

              <dl className="mt-10 divide-y divide-hairline border border-hairline bg-cream">
                <div className="flex items-baseline justify-between gap-6 px-5 py-4">
                  <dt className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                    Registration
                  </dt>
                  <dd className="font-display text-[0.9375rem] font-semibold text-ink-900">{company.registration}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-6 px-5 py-4">
                  <dt className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                    CSD
                  </dt>
                  <dd className="font-display text-[0.9375rem] font-semibold text-ink-900">{company.csd}</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal index={1}>
              <ContactForm />
            </Reveal>
          </div>
        </Container>
      </section>
    </>);

}