import { useEffect, useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { faqCategories, faqItems, type FaqItem } from '../data/faq';

const ALL = 'All' as const;

/**
 * FAQPage structured data, mirroring the visible accordion content exactly (Google penalizes
 * structured data that doesn't match what's rendered — per docs/SEO_ACCESSIBILITY_PLAN.md §3).
 * Same injection pattern as OrganizationSchema in Seo.tsx: this exact JSON is allow-listed in
 * vercel.json's CSP via a sha256 hash. If this content changes, that hash must be regenerated or
 * the script gets silently blocked again — see the comment on OrganizationSchema for how.
 */
function FaqSchema() {
  useEffect(() => {
    const id = 'kamosa-faq-schema';
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer }
      }))
    });
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return null;
}

export function Faq() {
  const [activeCategory, setActiveCategory] = useState<FaqItem['category'] | typeof ALL>(ALL);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesCategory = activeCategory === ALL || item.category === activeCategory;
      const matchesQuery =
      query.trim() === '' ||
      item.question.toLowerCase().includes(query.toLowerCase()) ||
      item.answer.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <>
      <Seo
        title="Frequently Asked Questions | Kamosa (Pty) Ltd"
        description="Answers to common questions about Kamosa's health & safety, consulting, procurement and training services." />
      <FaqSchema />

      <PageHeader
        eyebrow="FAQ"
        title="Frequently asked questions."
        body="Answers to common questions about Kamosa's services, credentials, and how to get in touch."
        crumbs={[{ label: 'FAQ' }]} />

      <section className="kamosa-section bg-white" aria-label="Frequently asked questions">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden={true} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search questions…"
                  aria-label="Search FAQ"
                  className="w-full rounded-sm border border-hairline bg-white py-3 pl-11 pr-4 text-[0.9375rem] text-ink-900 transition-colors duration-200 focus:border-brand-600" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory(ALL)}
                  className={`rounded-sm border px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  activeCategory === ALL ? 'border-ink-900 bg-ink-900 text-white' : 'border-hairline text-ink-900 hover:border-ink-900'}`
                  }>
                  All
                </button>
                {faqCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-sm border px-3.5 py-1.5 text-[0.8125rem] font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                    activeCategory === category ? 'border-ink-900 bg-ink-900 text-white' : 'border-hairline text-ink-900 hover:border-ink-900'}`
                    }>
                    {category}
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal index={1} className="mt-8">
              {filtered.length === 0 ? (
                <p className="border border-hairline bg-cream p-6 text-[0.9375rem] text-muted">
                  No questions match your search. Try a different term, or{' '}
                  <a href="/contact" className="font-medium text-brand-600 underline underline-offset-2">
                    contact us directly
                  </a>
                  .
                </p>
              ) : (
                <div className="divide-y divide-hairline border border-hairline">
                  {filtered.map((item) => (
                    <details key={item.id} className="group p-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[0.9375rem] font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                        {item.question}
                        <span aria-hidden="true" className="shrink-0 text-muted transition-transform duration-200 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{item.answer}</p>
                    </details>
                  ))}
                </div>
              )}
            </Reveal>
          </div>
        </Container>
      </section>
    </>);

}
