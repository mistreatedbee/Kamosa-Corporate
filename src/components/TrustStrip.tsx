import { Container } from './Container';
import { Reveal } from './Reveal';
import { trustMarkers } from '../data/company';

export function TrustStrip() {
  return (
    <section aria-label="Company credentials" className="bg-ink-900">
      <Container className="py-12 lg:py-14">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
          {trustMarkers.map((marker, i) =>
          <Reveal as="li" key={marker.label} index={i} className="lg:border-l lg:border-white/12 lg:pl-8">
              <p className="font-display text-[1.75rem] font-bold leading-none tracking-tight text-gold lg:text-[2rem]">
                {marker.value}
              </p>
              <p className="mt-2.5 text-sm leading-snug text-white/70">{marker.label}</p>
            </Reveal>
          )}
        </ul>
      </Container>
    </section>);

}