import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { TrustStrip } from '../components/TrustStrip';
import { ValuesSection } from '../components/ValuesSection';
import { Methodology } from '../components/Methodology';
import { Credentials } from '../components/Credentials';
import { EnvironmentalSection } from '../components/EnvironmentalSection';
import { CTASection } from '../components/CTASection';
import { company } from '../data/company';

const facts = [
{ label: 'Company', value: 'Kamosa (Pty) Ltd' },
{ label: 'Registration', value: company.registration },
{ label: 'CSD Number', value: company.csd },
{ label: 'Operating Area', value: company.operatingArea },
{ label: 'Ownership', value: '100% Black Female Owned' },
{ label: 'B-BBEE', value: 'Level 1 Contributor' }];


export function About() {
  return (
    <>
      <Seo
        title="About Kamosa (Pty) Ltd | Integrated Business Solutions"
        description="Kamosa (Pty) Ltd is a South African integrated business solutions company supporting operational performance, compliance, risk management and sustainable growth." />
      
      <PageHeader
        eyebrow="Who We Are"
        title="Integrated business solutions built around your operational reality."
        body="A South African professional services company supporting organisations across mining, construction, energy, manufacturing, transport and the public sector."
        crumbs={[{ label: 'About' }]}
        image={{
          src: "/6928b7ab-9299-4e7b-acb4-97116f4c86bf.jpg",
          alt: ''
        }} />
      
      <TrustStrip />

      <section className="kamosa-section bg-white" aria-labelledby="about-overview-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
            <div>
              <h2 id="about-overview-heading" className="text-display-sm text-balance text-ink-900">
                Practical support across the operational journey.
              </h2>
              <Reveal index={1} className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-muted">
                <p>
                  Kamosa (Pty) Ltd is an integrated business solutions company dedicated to helping organisations
                  improve operational performance, strengthen compliance, manage business risk, and achieve sustainable
                  growth.
                </p>
                <p>
                  Our services are designed to support businesses throughout their operational journey by providing
                  practical consulting, procurement, compliance, and support solutions tailored to each client&rsquo;s
                  unique requirements.
                </p>
                <p>
                  We work across four integrated service lines — health, safety and compliance; business consulting;
                  procurement and supply; and training and skills development — with environmental management and
                  compliance available through our associate network.
                </p>
                <p>
                  Our work is led by a SACPCMP-registered Construction Health and Safety Manager, and our documentation
                  is prepared to withstand review by clients, principal contractors, inspectors and tender evaluation
                  panels.
                </p>
              </Reveal>
            </div>

            <Reveal index={2}>
              <dl className="divide-y divide-hairline border border-hairline bg-cream">
                {facts.map((fact) =>
                <div key={fact.label} className="flex items-baseline justify-between gap-6 px-6 py-5">
                    <dt className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-muted">
                      {fact.label}
                    </dt>
                    <dd className="text-right font-display text-[0.9375rem] font-semibold text-ink-900">
                      {fact.value}
                    </dd>
                  </div>
                )}
              </dl>
            </Reveal>
          </div>
        </Container>
      </section>

      <ValuesSection />
      <Methodology />
      <Credentials />
      <EnvironmentalSection />
      <CTASection />
    </>);

}