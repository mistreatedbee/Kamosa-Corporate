import { Container } from './Container';
import { Reveal } from './Reveal';
import { SectionHeader } from './SectionHeader';
import { industries } from '../data/industries';

export function IndustryGrid() {
  const [lead, ...rest] = industries;

  return (
    <section className="kamosa-section bg-ink-900" aria-labelledby="industries-heading">
      <Container>
        <SectionHeader
          eyebrow="Industries We Serve"
          titleId="industries-heading"
          title="Experience across demanding industries."
          body="High-risk, heavily regulated environments where compliance failures carry real operational and legal consequences."
          inverted
          className="mb-14" />
        

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Reveal as="li" className="sm:col-span-2 lg:row-span-2">
            <IndustryTile industry={lead} tall />
          </Reveal>
          {rest.map((industry, i) =>
          <Reveal as="li" key={industry.name} index={i}>
              <IndustryTile industry={industry} />
            </Reveal>
          )}
        </ul>
      </Container>
    </section>);

}

interface IndustryTileProps {
  industry: (typeof industries)[number];
  tall?: boolean;
}

function IndustryTile({ industry, tall = false }: IndustryTileProps) {
  return (
    <article
      className={`group relative h-full overflow-hidden ${tall ? 'min-h-[300px] lg:min-h-[420px]' : 'min-h-[220px]'}`}>
      
      <img
        src={industry.image}
        alt={industry.imageAlt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.04]" />
      
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-ink-900/70 transition-colors duration-300 ease-editorial group-hover:bg-ink-900/55" />
      
      <div className="relative flex h-full flex-col justify-end p-6 lg:p-7">
        <h3 className={`font-display font-bold tracking-tight text-white ${tall ? 'text-2xl' : 'text-lg'}`}>
          {industry.name}
        </h3>
        <p
          className={`mt-2 text-white/75 ${tall ? 'max-w-sm text-[0.9375rem] leading-relaxed' : 'text-[0.875rem] leading-snug'}`}>
          
          {industry.description}
        </p>
        <span aria-hidden="true" className="mt-5 h-px w-10 bg-gold transition-all duration-300 ease-editorial group-hover:w-20" />
      </div>
    </article>);

}