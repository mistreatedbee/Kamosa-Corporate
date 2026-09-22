import {
  AwardIcon,
  BadgeCheckIcon,
  CompassIcon,
  LightbulbIcon,
  ScaleIcon,
  UsersIcon } from
'lucide-react';
import { Container } from './Container';
import { Reveal } from './Reveal';
import { values } from '../data/about';

const icons = [ScaleIcon, BadgeCheckIcon, CompassIcon, LightbulbIcon, AwardIcon, UsersIcon];

export function ValuesSection() {
  return (
    <section className="kamosa-section bg-cream" aria-labelledby="values-heading">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-brand-600">
              <span aria-hidden="true" className="h-px w-8 bg-gold" />
              Our Values
            </p>
            <Reveal>
              <h2 id="values-heading" className="text-display-sm text-balance text-ink-900">
                The standards that govern how we work.
              </h2>
            </Reveal>
          </div>

          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {values.map((value, i) => {
              const Icon = icons[i % icons.length];
              return (
                <Reveal as="li" key={value.title} index={i} className="flex gap-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink-900">{value.title}</h3>
                    <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{value.description}</p>
                  </div>
                </Reveal>);

            })}
          </ul>
        </div>
      </Container>
    </section>);

}