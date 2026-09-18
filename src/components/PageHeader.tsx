import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { Container } from './Container';

interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  body?: string;
  crumbs?: Crumb[];
  image?: {src: string;alt: string;};
}

export function PageHeader({ eyebrow, title, body, crumbs, image }: PageHeaderProps) {
  return (
    <section className="relative bg-ink-900 pt-[76px]" aria-labelledby="page-heading">
      {image ?
      <>
          <img
          src={image.src}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover" />
        
          <div aria-hidden="true" className="absolute inset-0 bg-ink-900/85" />
        </> :
      null}

      <Container className="relative py-16 lg:py-24">
        {crumbs && crumbs.length > 0 ?
        <nav aria-label="Breadcrumb" className="mb-9">
            <ol className="flex flex-wrap items-center gap-2 text-[0.8125rem] text-white/55">
              <li>
                <Link to="/" className="transition-colors duration-200 hover:text-white">
                  Home
                </Link>
              </li>
              {crumbs.map((crumb) =>
            <li key={crumb.label} className="flex items-center gap-2">
                  <ChevronRightIcon className="h-3.5 w-3.5 text-white/30" aria-hidden="true" />
                  {crumb.to ?
              <Link to={crumb.to} className="transition-colors duration-200 hover:text-white">
                      {crumb.label}
                    </Link> :

              <span aria-current="page" className="text-white">
                      {crumb.label}
                    </span>
              }
                </li>
            )}
            </ol>
          </nav> :
        null}

        <p className="flex items-center gap-3 font-display text-eyebrow font-semibold uppercase text-gold">
          <span aria-hidden="true" className="h-px w-8 bg-gold/60" />
          {eyebrow}
        </p>
        <h1 id="page-heading" className="mt-6 max-w-4xl text-display-lg text-balance text-white">
          {title}
        </h1>
        {body ? <p className="mt-7 max-w-prose text-[1.0625rem] leading-relaxed text-white/70">{body}</p> : null}
      </Container>
    </section>);

}