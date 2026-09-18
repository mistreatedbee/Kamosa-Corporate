import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon } from 'lucide-react';
import type { ServiceLine } from '../types/content';

interface ServiceCardProps {
  service: ServiceLine;
  featured?: boolean;
}

export function ServiceCard({ service, featured = false }: ServiceCardProps) {
  if (featured) {
    return (
      <Link
        to={`/services/${service.slug}`}
        className="group relative grid overflow-hidden border border-hairline bg-white transition-[transform,border-color,box-shadow] duration-200 ease-editorial hover:-translate-y-1 hover:border-ink-900/25 hover:shadow-lift lg:grid-cols-[1.15fr_0.85fr]">
        
        <div className="flex flex-col p-8 sm:p-10 lg:p-12">
          <div className="flex items-start justify-between gap-6">
            <span className="font-display text-sm font-bold tracking-[0.12em] text-gold">{service.number}</span>
            <span className="rounded-sm bg-cream px-2.5 py-1 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand-600">
              Core discipline
            </span>
          </div>
          <h3 className="mt-7 text-display-sm text-balance text-ink-900">{service.title}</h3>
          <p className="mt-5 max-w-prose text-[0.9375rem] leading-relaxed text-muted">{service.summary}</p>
          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            {service.capabilities.slice(0, 6).map((item) =>
            <li key={item} className="flex gap-2.5 text-[0.875rem] leading-snug text-ink-900/80">
                <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
                {item}
              </li>
            )}
          </ul>
          <span className="mt-auto inline-flex items-center gap-2 pt-9 font-display text-sm font-semibold text-brand-600">
            {service.ctaLabel}
            <ArrowUpRightIcon
              className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true" />
            
          </span>
        </div>
        <div className="relative min-h-[240px] overflow-hidden bg-cream lg:min-h-full">
          <img
            src={service.image}
            alt={service.imageAlt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.03]" />
          
          <div aria-hidden="true" className="absolute inset-0 bg-ink-900/15 mix-blend-multiply" />
        </div>
      </Link>);

  }

  return (
    <Link
      to={`/services/${service.slug}`}
      className="group flex h-full flex-col border border-hairline bg-white p-8 transition-[transform,border-color,box-shadow] duration-200 ease-editorial hover:-translate-y-1 hover:border-ink-900/25 hover:shadow-lift">
      
      <span className="font-display text-sm font-bold tracking-[0.12em] text-gold">{service.number}</span>
      <h3 className="mt-7 font-display text-xl font-bold leading-snug tracking-tight text-ink-900">
        {service.title}
      </h3>
      <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">{service.summary}</p>
      <ul className="mt-6 space-y-2">
        {service.capabilities.slice(0, 4).map((item) =>
        <li key={item} className="flex gap-2.5 text-[0.875rem] leading-snug text-ink-900/80">
            <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
            {item}
          </li>
        )}
      </ul>
      <span className="mt-auto inline-flex items-center gap-2 pt-8 font-display text-sm font-semibold text-brand-600">
        {service.ctaLabel}
        <ArrowUpRightIcon
          className="h-4 w-4 transition-transform duration-200 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true" />
        
      </span>
    </Link>);

}