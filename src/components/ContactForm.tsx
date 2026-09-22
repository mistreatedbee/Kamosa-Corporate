import React, { useRef, useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { Button } from './Button';
import { serviceOptions } from '../data/services';
import { company } from '../data/company';
import { submitEnquiry, validateEnquiry, type EnquiryPayload, type EnquiryResult } from '../utils/enquiry';

type Errors = Partial<Record<keyof EnquiryPayload, string>>;

const EMPTY: EnquiryPayload = {
  name: '',
  company: '',
  email: '',
  phone: '',
  service: '',
  message: ''
};

const fieldClass =
'w-full rounded-sm border border-hairline bg-white px-4 py-3.5 font-sans text-[0.9375rem] text-ink-900 transition-colors duration-200 placeholder:text-muted/60 hover:border-muted/50 focus:border-brand-600';
const errorFieldClass = 'border-error-600 hover:border-error-600';
const labelClass = 'block font-display text-[0.8125rem] font-semibold text-ink-900';

export function ContactForm() {
  const [values, setValues] = useState<EnquiryPayload>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EnquiryResult | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const statusRef = useRef<HTMLDivElement>(null);
  const formRenderedAt = useRef(Date.now());

  const update = (key: keyof EnquiryPayload) => (
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const nextErrors = validateEnquiry(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`enquiry-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    const outcome = await submitEnquiry(values, { website: honeypot, formRenderedAt: formRenderedAt.current });
    setSubmitting(false);
    setResult(outcome);

    // The form is only cleared on a confirmed submission.
    if (outcome.status === 'sent') setValues(EMPTY);
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  const describedBy = (key: keyof EnquiryPayload) => errors[key] ? `enquiry-${key}-error` : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-hairline bg-white p-7 sm:p-10">
      <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">Send an enquiry</h2>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
        Tell us about your operation and requirement. Fields marked with an asterisk are required.
      </p>

      {/* Honeypot: hidden from sighted and screen-reader users, but present in the DOM for
          simple bots that fill every field. Real visitors never see or populate this. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="enquiry-website">Website</label>
        <input
          id="enquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-name" className={labelClass}>
            Name <span className="text-gold">*</span>
          </label>
          <input
            id="enquiry-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={values.name}
            onChange={update('name')}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={describedBy('name')}
            className={`mt-2 ${fieldClass} ${errors.name ? errorFieldClass : ''}`} />
          
          <FieldError id="enquiry-name-error" message={errors.name} />
        </div>

        <div>
          <label htmlFor="enquiry-company" className={labelClass}>
            Company
          </label>
          <input
            id="enquiry-company"
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={update('company')}
            className={`mt-2 ${fieldClass}`} />
          
        </div>

        <div>
          <label htmlFor="enquiry-email" className={labelClass}>
            Email <span className="text-gold">*</span>
          </label>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={values.email}
            onChange={update('email')}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={describedBy('email')}
            className={`mt-2 ${fieldClass} ${errors.email ? errorFieldClass : ''}`} />
          
          <FieldError id="enquiry-email-error" message={errors.email} />
        </div>

        <div>
          <label htmlFor="enquiry-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="enquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={update('phone')}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={describedBy('phone')}
            className={`mt-2 ${fieldClass} ${errors.phone ? errorFieldClass : ''}`} />
          
          <FieldError id="enquiry-phone-error" message={errors.phone} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="enquiry-service" className={labelClass}>
            Service Required <span className="text-gold">*</span>
          </label>
          <select
            id="enquiry-service"
            name="service"
            required
            value={values.service}
            onChange={update('service')}
            aria-invalid={Boolean(errors.service)}
            aria-describedby={describedBy('service')}
            className={`mt-2 ${fieldClass} ${errors.service ? errorFieldClass : ''} ${
            values.service ? '' : 'text-muted'}`
            }>
            
            <option value="">Select a service</option>
            {serviceOptions.map((option) =>
            <option key={option} value={option}>
                {option}
              </option>
            )}
          </select>
          <FieldError id="enquiry-service-error" message={errors.service} />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="enquiry-message" className={labelClass}>
            Message <span className="text-gold">*</span>
          </label>
          <textarea
            id="enquiry-message"
            name="message"
            rows={5}
            required
            value={values.message}
            onChange={update('message')}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={describedBy('message')}
            className={`mt-2 resize-y ${fieldClass} ${errors.message ? errorFieldClass : ''}`} />
          
          <FieldError id="enquiry-message-error" message={errors.message} />
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" variant="primary" withArrow={!submitting} disabled={submitting}>
          {submitting ?
          <span className="flex items-center gap-2.5">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending enquiry
            </span> :

          'Send Enquiry'
          }
        </Button>
        <p className="text-[0.8125rem] leading-snug text-muted">
          Prefer to speak to someone?{' '}
          <a href={company.phoneHref} className="font-medium text-brand-600 underline-offset-2 hover:underline">
            {company.phone}
          </a>
        </p>
      </div>

      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={result ? 'mt-7' : 'sr-only'}>
        
        {result?.status === 'sent' ?
        <Notice tone="success" icon={CheckCircle2Icon}>
            Thank you. Your enquiry has been received. The Kamosa team will be in touch.
          </Notice> :
        null}

        {result?.status === 'error' ?
        <Notice tone="error" icon={AlertCircleIcon}>
            {result.message} Your details have been kept so you can try again.
          </Notice> :
        null}
      </div>
    </form>);

}

function FieldError({ id, message }: {id: string;message?: string;}) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
      <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>);

}

interface NoticeProps {
  tone: 'success' | 'error' | 'info';
  icon: React.ComponentType<{className?: string;'aria-hidden'?: boolean;}>;
  children: React.ReactNode;
}

const noticeTones: Record<NoticeProps['tone'], string> = {
  success: 'border-success-600/40 bg-success-50 text-ink-900',
  error: 'border-error-600/40 bg-error-50 text-ink-900',
  info: 'border-info-600/40 bg-info-50 text-ink-900'
};

function Notice({ tone, icon: Icon, children }: NoticeProps) {
  return (
    <div className={`flex gap-3 rounded-sm border p-4 text-[0.9375rem] leading-relaxed ${noticeTones[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden={true} />
      <p>{children}</p>
    </div>);

}