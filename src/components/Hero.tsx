import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ButtonLink } from './Button';

const EYEBROW = ['Health', 'Safety', 'Compliance', 'Business Solutions'];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const ease = [0.23, 1, 0.32, 1] as const;

  const rise = (delay: number) =>
  reduceMotion ?
  {} :
  {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease }
  };

  return (
    <section className="relative bg-ink-900 pt-[76px]" aria-labelledby="hero-heading">
      <div className="mx-auto grid w-full max-w-[1440px] items-stretch lg:grid-cols-[1.04fr_0.96fr]">
        <div className="flex min-h-[600px] items-center px-5 py-16 sm:px-8 lg:min-h-[650px] lg:justify-end lg:py-24 lg:pl-10 lg:pr-16">
          <div className="w-full max-w-[600px]">
            <motion.p
              {...rise(0.05)}
              className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-display text-eyebrow font-semibold uppercase text-gold">
              
              {EYEBROW.map((word, i) =>
              <React.Fragment key={word}>
                  {i > 0 ?
                <span aria-hidden="true" className="text-gold/50">
                      •
                    </span> :
                null}
                  <span>{word}</span>
                </React.Fragment>
              )}
            </motion.p>

            <motion.h1
              {...rise(0.12)}
              id="hero-heading"
              className="mt-7 text-display-xl text-balance text-white">
              
              Building Trust Through Professional Excellence.
            </motion.h1>

            <motion.p {...rise(0.2)} className="mt-7 max-w-prose text-[1.0625rem] leading-relaxed text-white/70 sm:text-lg">
              Practical, reliable and professional business solutions that support operational excellence, regulatory
              compliance and sustainable growth.
            </motion.p>

            <motion.div {...rise(0.28)} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <ButtonLink to="/services" variant="secondary">
                Explore Our Services
              </ButtonLink>
              <ButtonLink to="/contact" variant="outline" inverted>
                Get in Touch
              </ButtonLink>
            </motion.div>

            <motion.dl
              {...rise(0.36)}
              className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-white/12 pt-8">
              
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">Registration</dt>
                <dd className="mt-1.5 font-display text-sm font-semibold text-white">2023/164644/07</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-white/45">CSD Supplier</dt>
                <dd className="mt-1.5 font-display text-sm font-semibold text-white">MAAA1465904</dd>
              </div>
            </motion.dl>
          </div>
        </div>

        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, scale: 1.04 }}
          animate={reduceMotion ? {} : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease }}
          className="relative min-h-[320px] overflow-hidden sm:min-h-[420px] lg:min-h-[650px]">
          
          <img
            src="/d88a7876-ba83-4c30-b30d-f9cb4387d34e.jpg"
            alt="Health and safety professional in a hard hat and high-visibility vest reviewing a compliance checklist on an industrial walkway"
            className="absolute inset-0 h-full w-full object-cover"
            width={928}
            height={1160} />
          
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-ink-900/35 mix-blend-multiply" />
          
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-32 bg-ink-900/80 [mask-image:linear-gradient(to_right,black,transparent)] lg:block" />
          
        </motion.div>
      </div>
    </section>);

}