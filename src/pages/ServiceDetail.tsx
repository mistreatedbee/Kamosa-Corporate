import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { CTASection } from '../components/CTASection';
import { services } from '../data/services';

export function ServiceDetail() {
  const { slug } = useParams<{slug: string;}>();
  const service = services.find((item) => item.slug === slug);

  if (!service) return <Navigate to="/services" replace />;

  const others = services.filter((item) => item.slug !== service.slug);

  return (
    <>
      <Seo
        title={`${service.title} | Kamosa (Pty) Ltd`}
        description={service.description}
        image={service.image} />
      
      <PageHeader
        eyebrow={`Service ${service.number}`}
        title={service.title}
        body={service.description}
        crumbs={[{ label: 'Services', to: '/services' }, { label: service.shortTitle }]}
        image={{ src: service.image, alt: '' }} />
      

      <section className="kamosa-section bg-white" aria-labelledby="service-overview-heading">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div>
              <h2 id="service-overview-heading" className="text-display-sm text-balance text-ink-900">
                What this looks like in practice.
              </h2>
              <Reveal index={1}>
                <p className="mt-7 max-w-prose text-[1.0625rem] leading-relaxed text-muted">{service.intro}</p>
              </Reveal>

              <div className="mt-12 grid gap-px border border-hairline bg-hairline sm:grid-cols-2">
                {service.deliverables.map((item, i) =>
                <Reveal key={item.title} index={i} className="bg-white p-7">
                    <h3 className="font-display text-base font-semibold leading-snug text-ink-900">{item.title}</h3>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{item.body}</p>
                  </Reveal>
                )}
              </div>
            </div>

            <Reveal index={2} className="lg:sticky lg:top-28 lg:self-start">
              <div className="border-l-2 border-gold bg-cream p-8">
                <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.16em] text-ink-900">
                  Scope of services
                </h2>
                <ul className="mt-5 space-y-3">
                  {service.capabilities.map((capability) =>
                  <li key={capability} className="flex gap-3 text-[0.9375rem] leading-snug text-ink-900/85">
                      <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                      {capability}
                    </li>
                  )}
                </ul>
                <Link
                  to="/contact"
                  className="group mt-8 inline-flex items-center gap-2 font-display text-sm font-semibold text-brand-600">
                  
                  Discuss this service
                  <ArrowRightIcon
                    className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-1"
                    aria-hidden="true" />
                  
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="kamosa-section bg-cream" aria-labelledby="other-services-heading">
        <Container>
          <h2 id="other-services-heading" className="text-display-sm text-balance text-ink-900">
            Other service lines.
          </h2>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {others.map((other, i) =>
            <Reveal as="li" key={other.slug} index={i} className="h-full">
                <Link
                to={`/services/${other.slug}`}
                className="group flex h-full flex-col border border-hairline bg-white p-7 transition-[transform,border-color,box-shadow] duration-200 ease-editorial hover:-translate-y-1 hover:border-ink-900/25 hover:shadow-lift">
                
                  <span className="font-display text-sm font-bold tracking-[0.12em] text-gold">{other.number}</span>
                  <h3 className="mt-6 font-display text-lg font-bold leading-snug tracking-tight text-ink-900">
                    {other.title}
                  </h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{other.summary}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 font-display text-sm font-semibold text-brand-600">
                    {other.ctaLabel}
                    <ArrowRightIcon
                    className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-1"
                    aria-hidden="true" />
                  
                  </span>
                </Link>
              </Reveal>
            )}
          </ul>
        </Container>
      </section>

      <CTASection />
    </>);

}