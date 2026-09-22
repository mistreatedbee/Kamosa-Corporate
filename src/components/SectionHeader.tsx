import { Reveal } from './Reveal';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  titleId?: string;
  body?: string;
  inverted?: boolean;
  align?: 'left' | 'center';
  headingLevel?: 'h1' | 'h2';
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  body,
  inverted = false,
  align = 'left',
  headingLevel: Heading = 'h2',
  className = ''
}: SectionHeaderProps) {
  return (
    <Reveal
      className={`${align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'} ${className}`}>
      
      {eyebrow ?
      <p
        className={`mb-5 flex items-center gap-3 font-display text-eyebrow font-semibold uppercase ${
        align === 'center' ? 'justify-center' : ''} ${
        inverted ? 'text-gold' : 'text-brand-600'}`}>
        
          <span aria-hidden="true" className={`h-px w-8 ${inverted ? 'bg-gold/60' : 'bg-gold'}`} />
          {eyebrow}
        </p> :
      null}
      <Heading
        id={titleId}
        className={`text-display-md text-balance ${inverted ? 'text-white' : 'text-ink-900'}`}>
        
        {title}
      </Heading>
      {body ?
      <p
        className={`mt-6 max-w-prose text-[1.0625rem] leading-relaxed ${
        align === 'center' ? 'mx-auto' : ''} ${
        inverted ? 'text-white/70' : 'text-muted'}`}>
        
          {body}
        </p> :
      null}
    </Reveal>);

}