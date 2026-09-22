import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { CTASection } from '../components/CTASection';
import { environmentalCapabilities } from '../data/about';

export function EnvironmentalManagement() {
  return (
    <>
      <Seo
        title="Environmental Management & Compliance | Kamosa (Pty) Ltd"
        description="Environmental management and compliance support provided through Kamosa's associate network, including environmental compliance, EIA support and biodiversity conservation." />
      
      <PageHeader
        eyebrow="Associate Capability"
        title="Environmental Management & Compliance"
        body="Provided through Kamosa’s associate network rather than by in-house staff, and engaged on a project basis."
        crumbs={[{ label: 'Environmental Management' }]} />
      

      <section className="kamosa-section bg-white" aria-labelledby="environmental-overview-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <h2 id="environmental-overview-heading" className="text-display-sm text-balance text-ink-900">
                Extending environmental support without overstating our team.
              </h2>
              <Reveal index={1} className="mt-8 space-y-6 text-[1.0625rem] leading-relaxed text-muted">
                <p>
                  Environmental management and compliance sits alongside our four core service lines as an associate
                  capability. Where a client requires environmental input, we engage a suitably experienced associate
                  and manage the engagement alongside our own scope.
                </p>
                <p>
                  We are explicit about this arrangement: associates are not presented as Kamosa employees, and the
                  scope, responsibilities and deliverables of any associate-led work are confirmed with the client
                  before the engagement begins.
                </p>
              </Reveal>
            </div>

            <Reveal index={2} className="lg:self-start">
              <div className="border-l-2 border-gold bg-cream p-8">
                <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                  Capability areas
                </h2>
                <ul className="mt-5 space-y-3">
                  {environmentalCapabilities.map((item) =>
                  <li key={item} className="flex gap-3 text-[0.9375rem] leading-snug text-ink-900/85">
                      <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                      {item}
                    </li>
                  )}
                </ul>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <CTASection />
    </>);

}