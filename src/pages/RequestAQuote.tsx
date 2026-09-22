import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  HardHatIcon,
  Loader2Icon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon
} from 'lucide-react';
import { Seo } from '../components/Seo';
import { PageHeader } from '../components/PageHeader';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { company } from '../data/company';
import {
  QUOTE_FORM_DEFAULTS,
  submitQuoteRequest,
  type QuoteCategory,
  type QuoteRequestFormValues,
  type QuoteRequestResult
} from '../utils/quoteRequest';

interface ServiceCardDef {
  category: QuoteCategory;
  serviceSlug: string;
  label: string;
  preview: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
}

const SERVICE_CARDS: ServiceCardDef[] = [
  {
    category: 'health_safety',
    serviceSlug: 'health-safety-compliance',
    label: 'Health, Safety & Compliance',
    preview: "We'll ask about your site type and, optionally, worker count and compliance status.",
    icon: ShieldCheckIcon
  },
  {
    category: 'training',
    serviceSlug: 'training-skills-development',
    label: 'Training & Skills Development',
    preview: "We'll ask which course and roughly how many participants.",
    icon: UsersIcon
  },
  {
    category: 'procurement',
    serviceSlug: 'procurement-supply',
    label: 'Procurement & Supply',
    preview: "We'll ask what category of goods and roughly how many.",
    icon: TruckIcon
  },
  {
    category: 'other',
    serviceSlug: 'business-consulting',
    label: 'Business Consulting',
    preview: "We'll ask what you're looking to achieve, in your own words.",
    icon: HardHatIcon
  },
  {
    category: 'other',
    serviceSlug: 'environmental',
    label: 'Environmental Management',
    preview: "We'll ask what you're looking to achieve, in your own words.",
    icon: HardHatIcon
  }
];

const fieldClass =
  'w-full rounded-sm border border-hairline bg-white px-4 py-3.5 font-sans text-[0.9375rem] text-ink-900 transition-colors duration-200 placeholder:text-muted/60 hover:border-muted/50 focus:border-brand-600';
const errorFieldClass = 'border-error-600 hover:border-error-600';
const labelClass = 'block font-display text-[0.8125rem] font-semibold text-ink-900';

export function RequestAQuote() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [honeypot, setHoneypot] = useState('');
  const [formRenderedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuoteRequestResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<QuoteRequestFormValues>({ defaultValues: QUOTE_FORM_DEFAULTS, mode: 'onSubmit' });

  const category = watch('category');
  const selectedCard = SERVICE_CARDS.find((card) => card.serviceSlug === watch('serviceSlug'));

  const selectService = (card: ServiceCardDef) => {
    setValue('category', card.category);
    setValue('serviceSlug', card.serviceSlug);
    setStep(2);
  };

  const skipToContact = () => {
    setValue('category', 'other');
    setValue('serviceSlug', 'general');
    setStep(3);
  };

  const onSubmit = async (values: QuoteRequestFormValues) => {
    setSubmitting(true);
    setResult(null);
    const outcome = await submitQuoteRequest(values, { website: honeypot, formRenderedAt });
    setSubmitting(false);
    setResult(outcome);
  };

  if (result?.status === 'sent') {
    return (
      <>
        <Seo title="Request a Quote | Kamosa (Pty) Ltd" description="Request a quote from Kamosa (Pty) Ltd." />
        <PageHeader
          eyebrow="Request a Quote"
          title="Thank you — your quote request has been received."
          body="The Kamosa team will review your requirement and follow up directly."
          crumbs={[{ label: 'Request a Quote' }]} />
        <section className="kamosa-section bg-white">
          <Container>
            <div className="mx-auto max-w-2xl border border-hairline bg-white p-7 sm:p-10">
              <Notice tone="success" icon={CheckCircle2Icon}>
                Thank you. Your quote request has been received. The Kamosa team will be in touch.
              </Notice>
            </div>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo
        title="Request a Quote | Kamosa (Pty) Ltd"
        description="Request a quote from Kamosa (Pty) Ltd for health & safety, training, procurement, business consulting or environmental management support." />

      <PageHeader
        eyebrow="Request a Quote"
        title="Tell us what you need — we'll prepare a quote."
        body="A short, three-step form. Only the essentials are required; everything else helps us prepare a more accurate quote."
        crumbs={[{ label: 'Request a Quote' }]} />

      <section className="kamosa-section bg-white" aria-label="Quote request form">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-muted">
              <span aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'text-brand-600' : ''}>
                Step 1 of 3
              </span>
              <span aria-hidden="true">→</span>
              <span aria-current={step === 2 ? 'step' : undefined} className={step === 2 ? 'text-brand-600' : ''}>
                Step 2 of 3
              </span>
              <span aria-hidden="true">→</span>
              <span aria-current={step === 3 ? 'step' : undefined} className={step === 3 ? 'text-brand-600' : ''}>
                Step 3 of 3
              </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="border border-hairline bg-white p-7 sm:p-10">
              {/* Honeypot */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
                <label htmlFor="quote-website">Website</label>
                <input
                  id="quote-website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)} />
              </div>
              <input type="hidden" {...register('category')} />
              <input type="hidden" {...register('serviceSlug')} />

              {step === 1 ? (
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">
                    Which service is this for?
                  </h2>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    Select the service closest to your requirement.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {SERVICE_CARDS.map((card) => (
                      <button
                        key={card.serviceSlug}
                        type="button"
                        onClick={() => selectService(card)}
                        className="flex flex-col gap-3 rounded-sm border border-hairline bg-white p-5 text-left transition-colors duration-200 hover:border-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                        <card.icon className="h-6 w-6 text-brand-600" aria-hidden={true} />
                        <span className="font-display text-[0.9375rem] font-bold text-ink-900">{card.label}</span>
                        <span className="text-[0.8125rem] leading-snug text-muted">{card.preview}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={skipToContact}
                    className="mt-6 text-[0.8125rem] font-medium text-muted underline-offset-2 hover:text-brand-600 hover:underline">
                    Skip — just have someone call me
                  </button>
                </div>
              ) : null}

              {step === 2 && category ? (
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">
                    {selectedCard?.label}
                  </h2>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    Required fields are marked. Everything else is optional — skip if unsure.
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    {category === 'health_safety' ? (
                      <>
                        <Field label="Site / project type" required error={errors.siteType?.message}>
                          <input
                            className={inputClass(Boolean(errors.siteType))}
                            {...register('siteType', { required: 'Please tell us the site or project type.' })} />
                        </Field>
                        <Field label="General location (province/city)">
                          <input className={inputClass(false)} {...register('hsLocation')} />
                        </Field>
                        <Field label="Approximate worker count">
                          <input className={inputClass(false)} {...register('workerCount')} />
                        </Field>
                        <Field label="Duration">
                          <input className={inputClass(false)} placeholder="e.g. 3 months" {...register('duration')} />
                        </Field>
                        <Field label="Documentation needed" className="sm:col-span-2">
                          <input className={inputClass(false)} placeholder="e.g. safety file, HIRA, tender pack" {...register('docsNeeded')} />
                        </Field>
                        <Field label="Current compliance status" className="sm:col-span-2">
                          <input className={inputClass(false)} {...register('complianceStatus')} />
                        </Field>
                      </>
                    ) : null}

                    {category === 'training' ? (
                      <>
                        <Field label="Course of interest" required error={errors.course?.message}>
                          <input
                            className={inputClass(Boolean(errors.course))}
                            {...register('course', { required: 'Please tell us which course.' })} />
                        </Field>
                        <Field label="Approximate participant count" required error={errors.participantCount?.message}>
                          <input
                            className={inputClass(Boolean(errors.participantCount))}
                            {...register('participantCount', { required: 'Please give an approximate participant count.' })} />
                        </Field>
                        <Field label="Preferred date">
                          <input type="date" className={inputClass(false)} {...register('preferredDate')} />
                        </Field>
                        <Field label="Location">
                          <input className={inputClass(false)} {...register('trainingLocation')} />
                        </Field>
                        <Field label="Organisation type" className="sm:col-span-2">
                          <input className={inputClass(false)} {...register('organisationType')} />
                        </Field>
                      </>
                    ) : null}

                    {category === 'procurement' ? (
                      <>
                        <Field label="Product category" required error={errors.productCategory?.message}>
                          <input
                            className={inputClass(Boolean(errors.productCategory))}
                            placeholder="PPE, tools/consumables, or signage"
                            {...register('productCategory', { required: 'Please tell us the product category.' })} />
                        </Field>
                        <Field label="Approximate quantity" required error={errors.quantity?.message}>
                          <input
                            className={inputClass(Boolean(errors.quantity))}
                            {...register('quantity', { required: 'Please give an approximate quantity.' })} />
                        </Field>
                        <Field label="Delivery location">
                          <input className={inputClass(false)} {...register('deliveryLocation')} />
                        </Field>
                        <Field label="Needed by">
                          <input type="date" className={inputClass(false)} {...register('neededBy')} />
                        </Field>
                      </>
                    ) : null}

                    {category === 'other' ? (
                      <Field label="What are you looking to achieve?" required error={errors.freeText?.message} className="sm:col-span-2">
                        <textarea
                          rows={5}
                          className={`resize-y ${inputClass(Boolean(errors.freeText))}`}
                          {...register('freeText', { required: 'Please tell us what you are looking to achieve.' })} />
                      </Field>
                    ) : null}
                  </div>

                  <div className="mt-8 flex items-center gap-4">
                    <Button type="button" variant="outline" withArrow={false} onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" variant="primary" onClick={() => setStep(3)}>
                      Continue
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">Your details</h2>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">
                    Last step — how should we reach you?
                  </p>

                  <div className="mt-8 grid gap-6 sm:grid-cols-2">
                    <Field label="Name" required error={errors.name?.message}>
                      <input
                        className={inputClass(Boolean(errors.name))}
                        {...register('name', { required: 'Please enter your name.' })} />
                    </Field>
                    <Field label="Company / Organisation" required error={errors.company?.message}>
                      <input
                        className={inputClass(Boolean(errors.company))}
                        {...register('company', { required: 'Please enter your company or organisation.' })} />
                    </Field>
                    <Field label="Email" required error={errors.email?.message}>
                      <input
                        type="email"
                        className={inputClass(Boolean(errors.email))}
                        {...register('email', {
                          required: 'Please enter your email address.',
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: 'Please enter a valid email address.' }
                        })} />
                    </Field>
                    <Field label="Phone" required error={errors.phone?.message}>
                      <input
                        type="tel"
                        className={inputClass(Boolean(errors.phone))}
                        {...register('phone', { required: 'Please enter your phone number.' })} />
                    </Field>
                  </div>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Button type="button" variant="outline" withArrow={false} onClick={() => setStep(category ? 2 : 1)}>
                      Back
                    </Button>
                    <Button type="submit" variant="primary" withArrow={!submitting} disabled={submitting}>
                      {submitting ? (
                        <span className="flex items-center gap-2.5">
                          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Sending request
                        </span>
                      ) : (
                        'Send Quote Request'
                      )}
                    </Button>
                    <p className="text-[0.8125rem] leading-snug text-muted">
                      Prefer to speak to someone?{' '}
                      <a href={company.phoneHref} className="font-medium text-brand-600 underline-offset-2 hover:underline">
                        {company.phone}
                      </a>
                    </p>
                  </div>

                  {result?.status === 'error' ? (
                    <div className="mt-7">
                      <Notice tone="error" icon={AlertCircleIcon}>
                        {result.message} Your details have been kept so you can try again.
                      </Notice>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </form>
          </div>
        </Container>
      </section>
    </>
  );
}

function inputClass(hasError: boolean) {
  return `mt-2 ${fieldClass} ${hasError ? errorFieldClass : ''}`;
}

function Field({
  label,
  required,
  error,
  className,
  children
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label} {required ? <span className="text-gold">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
          <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
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
