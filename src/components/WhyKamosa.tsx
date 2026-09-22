import { Container } from './Container';
import { Reveal } from './Reveal';
import { whyKamosa } from '../data/about';

export function WhyKamosa() {
  return (
    <section className="kamosa-section bg-cream" aria-labelledby="why-heading">
      <Container>
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-brand-600">
            <span aria-hidden="true" className="h-px w-8 bg-gold" />
            Why Kamosa
          </p>
          <Reveal>
            <h2 id="why-heading" className="text-display-md text-balance text-ink-900">
              More than technical expertise. A partner committed to practical results.
            </h2>
          </Reveal>
        </div>

        <ol className="mt-14 border-t border-ink-900/12">
          {whyKamosa.map((item, i) =>
          <Reveal
            as="li"
            key={item.title}
            index={i}
            className="group grid gap-3 border-b border-ink-900/12 py-8 transition-colors duration-200 ease-editorial hover:bg-white lg:grid-cols-[4rem_1fr_1.35fr] lg:items-baseline lg:gap-10 lg:px-4">
            
              <span className="font-display text-sm font-bold tracking-[0.12em] text-gold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="font-display text-xl font-bold leading-snug tracking-tight text-ink-900">
                {item.title}
              </h3>
              <p className="max-w-prose text-[0.9375rem] leading-relaxed text-muted">{item.description}</p>
            </Reveal>
          )}
        </ol>
      </Container>
    </section>);

}