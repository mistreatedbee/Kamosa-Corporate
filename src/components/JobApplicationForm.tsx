import React, { useRef, useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon, PaperclipIcon, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { submitApplication, validateApplication, type ApplicationPayload, type ApplicationResult } from '../utils/careers';

const EMPTY: ApplicationPayload = { name: '', email: '', phone: '', coverMessage: '' };

const fieldClass =
  'w-full rounded-sm border border-hairline bg-white px-4 py-3.5 font-sans text-[0.9375rem] text-ink-900 transition-colors duration-200 placeholder:text-muted/60 hover:border-muted/50 focus:border-brand-600';
const errorFieldClass = 'border-error-600 hover:border-error-600';
const labelClass = 'block font-display text-[0.8125rem] font-semibold text-ink-900';

interface JobApplicationFormProps {
  jobPostingId: string;
  jobTitle: string;
}

export function JobApplicationForm({ jobPostingId, jobTitle }: JobApplicationFormProps) {
  const [values, setValues] = useState<ApplicationPayload>(EMPTY);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationPayload | 'cv', string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const statusRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRenderedAt = useRef(Date.now());

  const update = (key: keyof ApplicationPayload) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCvFile(event.target.files?.[0] ?? null);
    if (errors.cv) setErrors((prev) => ({ ...prev, cv: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const nextErrors = validateApplication(values, cvFile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const outcome = await submitApplication(jobPostingId, values, cvFile as File, {
      website: honeypot,
      formRenderedAt: formRenderedAt.current
    });
    setSubmitting(false);
    setResult(outcome);

    if (outcome.status === 'sent') {
      setValues(EMPTY);
      setCvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  const idPrefix = `apply-${jobPostingId}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="border-t border-hairline bg-cream/50 p-6 sm:p-8">
      <h3 className="font-display text-base font-bold text-ink-900">Apply for {jobTitle}</h3>

      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          id={`${idPrefix}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)} />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-name`} className={labelClass}>
            Name <span className="text-gold">*</span>
          </label>
          <input
            id={`${idPrefix}-name`}
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={update('name')}
            aria-invalid={Boolean(errors.name)}
            className={`mt-2 ${fieldClass} ${errors.name ? errorFieldClass : ''}`} />
          <FieldError message={errors.name} />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-email`} className={labelClass}>
            Email <span className="text-gold">*</span>
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.email)}
            className={`mt-2 ${fieldClass} ${errors.email ? errorFieldClass : ''}`} />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-phone`} className={labelClass}>
            Phone
          </label>
          <input
            id={`${idPrefix}-phone`}
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={update('phone')}
            aria-invalid={Boolean(errors.phone)}
            className={`mt-2 ${fieldClass} ${errors.phone ? errorFieldClass : ''}`} />
          <FieldError message={errors.phone} />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-cv`} className={labelClass}>
            CV <span className="text-gold">*</span>
          </label>
          <div className="relative mt-2">
            <input
              ref={fileInputRef}
              id={`${idPrefix}-cv`}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
              aria-invalid={Boolean(errors.cv)}
              className="block w-full cursor-pointer rounded-sm border border-hairline bg-white px-4 py-3 text-[0.875rem] text-ink-900 file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-[0.8125rem] file:font-semibold file:text-white hover:border-muted/50" />
          </div>
          {cvFile ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[0.75rem] text-muted">
              <PaperclipIcon className="h-3 w-3" aria-hidden={true} />
              {cvFile.name}
            </p>
          ) : (
            <p className="mt-1.5 text-[0.75rem] text-muted">PDF or Word document, up to 5MB.</p>
          )}
          <FieldError message={errors.cv} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-message`} className={labelClass}>
            Cover message
          </label>
          <textarea
            id={`${idPrefix}-message`}
            rows={4}
            value={values.coverMessage}
            onChange={update('coverMessage')}
            placeholder="Tell us why you'd be a good fit (optional)."
            className={`mt-2 resize-y ${fieldClass}`} />
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" variant="primary" withArrow={!submitting} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2.5">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
              Submitting application
            </span>
          ) : (
            'Submit Application'
          )}
        </Button>
      </div>

      <div ref={statusRef} tabIndex={-1} role="status" aria-live="polite" className={result ? 'mt-6' : 'sr-only'}>
        {result?.status === 'sent' ? (
          <Notice tone="success" icon={CheckCircle2Icon}>
            Thank you. Your application has been received. The Kamosa team will be in touch.
          </Notice>
        ) : null}
        {result?.status === 'error' ? (
          <Notice tone="error" icon={AlertCircleIcon}>
            {result.message}
          </Notice>
        ) : null}
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
      <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

interface NoticeProps {
  tone: 'success' | 'error';
  icon: LucideIcon;
  children: React.ReactNode;
}

const noticeTones: Record<NoticeProps['tone'], string> = {
  success: 'border-success-600/40 bg-success-50 text-ink-900',
  error: 'border-error-600/40 bg-error-50 text-ink-900'
};

function Notice({ tone, icon: Icon, children }: NoticeProps) {
  return (
    <div className={`flex gap-3 rounded-sm border p-4 text-[0.9375rem] leading-relaxed ${noticeTones[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden={true} />
      <p>{children}</p>
    </div>
  );
}
