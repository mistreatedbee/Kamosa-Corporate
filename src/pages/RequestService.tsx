import { useState } from 'react';
import { AlertCircleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { serviceSlugOptions } from '../data/services';
import { company } from '../data/company';
import { useFormSubmission } from '../hooks/useFormSubmission';
import {
  submitServiceRequest,
  validateServiceRequest,
  type ServiceRequestPayload
} from '../utils/serviceRequest';

const EMPTY: ServiceRequestPayload = { name: '', email: '', phone: '', serviceSlug: '', description: '' };

const fieldClass =
  'w-full rounded-sm border border-hairline bg-white px-4 py-3.5 font-sans text-[0.9375rem] text-ink-900 transition-colors duration-200 placeholder:text-muted/60 hover:border-muted/50 focus:border-brand-600';
const errorFieldClass = 'border-error-600 hover:border-error-600';
const labelClass = 'block font-display text-[0.8125rem] font-semibold text-ink-900';

const FORM_ID = 'service-request';

export function RequestService() {
  const [honeypot, setHoneypot] = useState('');
  const [formRenderedAt] = useState(() => Date.now());

  const { values, errors, submitting, result, update, handleSubmit, describedBy, statusRef } = useFormSubmission({
    initial: EMPTY,
    validate: validateServiceRequest,
    submit: (payload) => submitServiceRequest(payload, { website: honeypot, formRenderedAt })
  });

  return (
    <>
      <Seo
        title="Request a Service | Kamosa (Pty) Ltd"
        description="Already know what you need? Tell Kamosa which service to action and we will follow up directly." />

      <PageHeader
        eyebrow="Request a Service"
        title="Know what you need? Tell us directly."
        body="For visitors who already know which Kamosa service they require — we will follow up to confirm scope and next steps."
        crumbs={[{ label: 'Request a Service' }]} />

      <section className="kamosa-section bg-white" aria-label="Service request form">
        <Container>
          <div className="mx-auto max-w-2xl">
            <form onSubmit={(event) => handleSubmit(event, FORM_ID)} noValidate className="border border-hairline bg-white p-7 sm:p-10">
              {/* Honeypot — hidden from sighted and screen-reader users. See ContactForm.tsx. */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
                <label htmlFor={`${FORM_ID}-website`}>Website</label>
                <input
                  id={`${FORM_ID}-website`}
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)} />
              </div>

              <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">Request a service</h2>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                Tell us which service you need and a short description. Fields marked with an asterisk are required.
              </p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor={`${FORM_ID}-name`} className={labelClass}>
                    Name <span className="text-gold">*</span>
                  </label>
                  <input
                    id={`${FORM_ID}-name`}
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={values.name}
                    onChange={update('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={describedBy('name')}
                    className={`mt-2 ${fieldClass} ${errors.name ? errorFieldClass : ''}`} />
                  <FieldError id="name-error" message={errors.name} />
                </div>

                <div>
                  <label htmlFor={`${FORM_ID}-email`} className={labelClass}>
                    Email <span className="text-gold">*</span>
                  </label>
                  <input
                    id={`${FORM_ID}-email`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={values.email}
                    onChange={update('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={describedBy('email')}
                    className={`mt-2 ${fieldClass} ${errors.email ? errorFieldClass : ''}`} />
                  <FieldError id="email-error" message={errors.email} />
                </div>

                <div>
                  <label htmlFor={`${FORM_ID}-phone`} className={labelClass}>
                    Phone
                  </label>
                  <input
                    id={`${FORM_ID}-phone`}
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={update('phone')}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={describedBy('phone')}
                    className={`mt-2 ${fieldClass} ${errors.phone ? errorFieldClass : ''}`} />
                  <FieldError id="phone-error" message={errors.phone} />
                </div>

                <div>
                  <label htmlFor={`${FORM_ID}-serviceSlug`} className={labelClass}>
                    Service <span className="text-gold">*</span>
                  </label>
                  <select
                    id={`${FORM_ID}-serviceSlug`}
                    name="serviceSlug"
                    required
                    value={values.serviceSlug}
                    onChange={update('serviceSlug')}
                    aria-invalid={Boolean(errors.serviceSlug)}
                    aria-describedby={describedBy('serviceSlug')}
                    className={`mt-2 ${fieldClass} ${errors.serviceSlug ? errorFieldClass : ''} ${
                      values.serviceSlug ? '' : 'text-muted'}`}>
                    <option value="">Select a service</option>
                    {serviceSlugOptions.map((option) => (
                      <option key={option.slug} value={option.slug}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError id="serviceSlug-error" message={errors.serviceSlug} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor={`${FORM_ID}-description`} className={labelClass}>
                    Brief description <span className="text-gold">*</span>
                  </label>
                  <textarea
                    id={`${FORM_ID}-description`}
                    name="description"
                    rows={5}
                    required
                    value={values.description}
                    onChange={update('description')}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={describedBy('description')}
                    className={`mt-2 resize-y ${fieldClass} ${errors.description ? errorFieldClass : ''}`} />
                  <FieldError id="description-error" message={errors.description} />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button type="submit" variant="primary" withArrow={!submitting} disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2.5">
                      <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending request
                    </span>
                  ) : (
                    'Send Request'
                  )}
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
                {result?.status === 'sent' ? (
                  <Notice tone="success" icon={CheckCircle2Icon}>
                    Thank you. Your request has been received. The Kamosa team will be in touch.
                  </Notice>
                ) : null}
                {result?.status === 'error' ? (
                  <Notice tone="error" icon={AlertCircleIcon}>
                    {result.message} Your details have been kept so you can try again.
                  </Notice>
                ) : null}
              </div>
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
      <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

interface NoticeProps {
  tone: 'success' | 'error';
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
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
