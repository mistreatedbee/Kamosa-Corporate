import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseIcon, ClockIcon, Loader2Icon, MapPinIcon, SearchIcon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Reveal } from '../components/Reveal';
import { fetchOpenJobPostings } from '../utils/careers';
import { WORK_ARRANGEMENT_LABELS, formatSalary, type JobPosting } from '../types/careers';
import { company } from '../data/company';

export function Careers() {
  const [postings, setPostings] = useState<JobPosting[] | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [arrangementFilter, setArrangementFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'title'>('newest');

  useEffect(() => {
    fetchOpenJobPostings().then(setPostings);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set((postings ?? []).map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [postings]
  );
  const employmentTypes = useMemo(() => Array.from(new Set((postings ?? []).map((p) => p.employment_type))), [postings]);

  const visiblePostings = useMemo(() => {
    let list = postings ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) => p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    if (typeFilter) list = list.filter((p) => p.employment_type === typeFilter);
    if (arrangementFilter) list = list.filter((p) => p.work_arrangement === arrangementFilter);
    return [...list].sort((a, b) =>
      sort === 'title' ? a.title.localeCompare(b.title) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [postings, search, categoryFilter, typeFilter, arrangementFilter, sort]);

  return (
    <>
      <Seo
        title="Careers | Kamosa (Pty) Ltd"
        description="Join Kamosa (Pty) Ltd. View current openings and apply with your CV." />

      <PageHeader
        eyebrow="Careers"
        title="Build your career with Kamosa."
        body="We're a growing health, safety and compliance consultancy. Have a look at our current openings below."
        crumbs={[{ label: 'Careers' }]} />

      <section className="kamosa-section bg-white" aria-label="Current openings">
        <Container>
          {postings === null ? (
            <div className="flex items-center gap-2 py-16 text-[0.9375rem] text-muted">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
              Loading current openings…
            </div>
          ) : null}

          {postings && postings.length === 0 ? (
            <Reveal>
              <div className="border border-hairline bg-cream px-8 py-16 text-center">
                <BriefcaseIcon className="mx-auto h-8 w-8 text-brand-600/40" aria-hidden={true} />
                <p className="mt-5 font-display text-lg font-bold text-ink-900">No open positions right now</p>
                <p className="mx-auto mt-2.5 max-w-md text-[0.9375rem] leading-relaxed text-muted">
                  We don't have any vacancies at the moment, but we're always happy to hear from good people. Feel
                  free to email your CV to{' '}
                  <a href={company.emailHref} className="font-medium text-brand-600 hover:underline">
                    {company.email}
                  </a>{' '}
                  and we'll keep it on file.
                </p>
              </div>
            </Reveal>
          ) : null}

          {postings && postings.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-3 border border-hairline bg-cream/50 p-4">
                <div className="relative min-w-[220px] flex-1">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden={true} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search job title or keyword…"
                    className="w-full rounded-sm border border-hairline bg-white py-2.5 pl-9 pr-3 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
                </div>
                {categories.length > 0 ? (
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-sm border border-hairline bg-white px-3 py-2.5 text-[0.875rem] text-ink-900">
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-sm border border-hairline bg-white px-3 py-2.5 text-[0.875rem] text-ink-900">
                  <option value="">All types</option>
                  {employmentTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select value={arrangementFilter} onChange={(e) => setArrangementFilter(e.target.value)} className="rounded-sm border border-hairline bg-white px-3 py-2.5 text-[0.875rem] text-ink-900">
                  <option value="">On-site, remote or hybrid</option>
                  {Object.entries(WORK_ARRANGEMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-sm border border-hairline bg-white px-3 py-2.5 text-[0.875rem] text-ink-900">
                  <option value="newest">Newest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>

              {visiblePostings.length === 0 ? (
                <p className="mt-8 text-[0.9375rem] text-muted">No roles match your search. Try clearing a filter.</p>
              ) : (
                <div className="mt-8 space-y-4">
                  {visiblePostings.map((posting, index) => (
                    <Reveal key={posting.id} index={index}>
                      <JobCard posting={posting} />
                    </Reveal>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </Container>
      </section>
    </>
  );
}

function JobCard({ posting }: { posting: JobPosting }) {
  const salary = formatSalary(posting);
  return (
    <Link
      to={`/careers/${posting.id}`}
      className="block border border-hairline bg-white p-6 transition-colors duration-200 hover:border-ink-900 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">{posting.title}</h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[0.8125rem] text-muted">
            {posting.category ? <span>{posting.category}</span> : null}
            <span className="flex items-center gap-1.5">
              <MapPinIcon className="h-3.5 w-3.5" aria-hidden={true} />
              {posting.work_arrangement === 'remote' ? 'Remote' : posting.location}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" aria-hidden={true} />
              {posting.employment_type}
            </span>
            {salary ? <span className="font-semibold text-ink-900">{salary}</span> : null}
          </div>
          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-muted">{posting.summary}</p>
        </div>
        <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-[0.75rem] font-medium text-ink-900">
          {new Date(posting.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <span className="mt-5 inline-block text-[0.8125rem] font-semibold text-brand-600">View job & apply →</span>
    </Link>
  );
}
