import { BriefcaseIcon, CalendarIcon, ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { WORK_ARRANGEMENT_LABELS, formatSalary, type JobPosting } from '../../types/careers';

/** Renders a job posting the same way everywhere it's shown to a human — the admin's "Preview"
 * step and the real public job detail page share this component on purpose, so what an admin
 * approves before publishing is pixel-identical to what an applicant actually sees. */
export function JobPostingPreview({ posting }: { posting: JobPosting }) {
  const salary = formatSalary(posting);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
        {posting.department ? <span>{posting.department}</span> : null}
        <span className="flex items-center gap-1.5">
          <MapPinIcon className="h-3.5 w-3.5" aria-hidden={true} />
          {posting.work_arrangement === 'remote' ? 'Remote' : posting.location}
        </span>
        <span className="flex items-center gap-1.5">
          <ClockIcon className="h-3.5 w-3.5" aria-hidden={true} />
          {posting.employment_type}
        </span>
        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.75rem] font-medium text-ink-900">
          {WORK_ARRANGEMENT_LABELS[posting.work_arrangement]}
        </span>
        {posting.vacancies > 1 ? (
          <span className="flex items-center gap-1.5">
            <UsersIcon className="h-3.5 w-3.5" aria-hidden={true} />
            {posting.vacancies} positions
          </span>
        ) : null}
      </div>

      {salary ? (
        <p className="mt-4 font-display text-[1.0625rem] font-bold text-ink-900">{salary}</p>
      ) : null}

      <p className="mt-4 max-w-2xl whitespace-pre-line text-[0.9375rem] leading-relaxed text-muted">{posting.summary}</p>

      {posting.responsibilities.length > 0 ? (
        <Section title="Responsibilities" items={posting.responsibilities} />
      ) : null}

      {posting.requirements.length > 0 ? <Section title="Essential requirements" items={posting.requirements} /> : null}
      {posting.preferred_requirements.length > 0 ? (
        <Section title="Preferred (nice to have)" items={posting.preferred_requirements} />
      ) : null}
      {posting.qualifications.length > 0 ? <Section title="Qualifications & certifications" items={posting.qualifications} /> : null}
      {posting.languages.length > 0 ? <Section title="Languages" items={posting.languages} /> : null}

      {posting.min_experience_years || posting.education_level ? (
        <div className="mt-6 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2">
          {posting.min_experience_years ? (
            <div>
              <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">Minimum experience</p>
              <p className="mt-1.5 text-[0.9375rem] text-muted">{posting.min_experience_years}+ years</p>
            </div>
          ) : null}
          {posting.education_level ? (
            <div>
              <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">Education level</p>
              <p className="mt-1.5 text-[0.9375rem] text-muted">{posting.education_level}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {posting.benefits.length > 0 ? <Section title="Benefits" items={posting.benefits} /> : null}

      <div className="mt-6 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2">
        {posting.working_hours ? (
          <div>
            <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">Working hours</p>
            <p className="mt-1.5 text-[0.9375rem] text-muted">{posting.working_hours}</p>
          </div>
        ) : null}
        {posting.start_date ? (
          <div>
            <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">Expected start date</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.9375rem] text-muted">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden={true} />
              {new Date(posting.start_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : null}
        {posting.closing_date ? (
          <div>
            <p className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">Application closing date</p>
            <p className="mt-1.5 text-[0.9375rem] text-muted">
              {new Date(posting.closing_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : null}
      </div>

      {posting.application_instructions ? (
        <div className="mt-6 flex gap-3 rounded-sm border border-hairline bg-cream/50 p-4">
          <BriefcaseIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden={true} />
          <p className="text-[0.875rem] leading-relaxed text-ink-900">{posting.application_instructions}</p>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-6 border-t border-hairline pt-6">
      <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.14em] text-ink-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug text-muted">
            <span aria-hidden="true" className="mt-[0.5rem] h-1 w-1 shrink-0 bg-gold" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
