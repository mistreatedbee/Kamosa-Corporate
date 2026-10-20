import { useState } from 'react';
import { CheckIcon, PlusIcon, TrashIcon } from 'lucide-react';
import { RepeatableListField } from './RepeatableListField';
import { JobPostingPreview } from '../careers/JobPostingPreview';
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  SALARY_FREQUENCIES,
  WORK_ARRANGEMENTS,
  WORK_ARRANGEMENT_LABELS,
  type DocumentType,
  type JobPosting,
  type ScreeningQuestion,
  type WorkArrangement
} from '../../types/careers';

export interface WizardValues {
  title: string;
  department: string;
  location: string;
  category: string;
  industry: string;
  vacancies: string;
  summary: string;
  responsibilities: string[];
  employmentType: string;
  workArrangement: WorkArrangement;
  requirements: string[];
  preferredRequirements: string[];
  qualifications: string[];
  minExperienceYears: string;
  educationLevel: string;
  languages: string[];
  salaryMin: string;
  salaryMax: string;
  salaryCurrency: string;
  salaryFrequency: string;
  salaryPublic: boolean;
  salaryNegotiable: boolean;
  benefits: string[];
  workingHours: string;
  startDate: string;
  opensAt: string;
  closingDate: string;
  requiredDocuments: DocumentType[];
  screeningQuestions: ScreeningQuestion[];
  applicationMethod: 'website' | 'email' | 'external';
  applicationEmail: string;
  applicationUrl: string;
  applicationInstructions: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
}

export const EMPTY_WIZARD_VALUES: WizardValues = {
  title: '',
  department: '',
  location: 'South Africa',
  category: '',
  industry: '',
  vacancies: '1',
  summary: '',
  responsibilities: [],
  employmentType: 'Full-time',
  workArrangement: 'on-site',
  requirements: [],
  preferredRequirements: [],
  qualifications: [],
  minExperienceYears: '',
  educationLevel: '',
  languages: [],
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: 'ZAR',
  salaryFrequency: 'Monthly',
  salaryPublic: false,
  salaryNegotiable: false,
  benefits: [],
  workingHours: '',
  startDate: '',
  opensAt: '',
  closingDate: '',
  requiredDocuments: ['cv'],
  screeningQuestions: [],
  applicationMethod: 'website',
  applicationEmail: '',
  applicationUrl: '',
  applicationInstructions: '',
  recruiterName: '',
  recruiterEmail: '',
  recruiterPhone: ''
};

const STEPS = ['Basic Info', 'Employment Details', 'Requirements', 'Application Settings', 'Preview & Publish'] as const;

const inputClass =
  'mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none';
const labelClass = 'text-[0.8125rem] font-semibold text-ink-900';
const helpClass = 'mt-1 text-[0.75rem] text-muted';

interface JobPostingWizardProps {
  initial: WizardValues;
  onCancel: () => void;
  onSaveDraft: (values: WizardValues) => Promise<boolean>;
  onPublish: (values: WizardValues) => Promise<boolean>;
}

export function JobPostingWizard({ initial, onCancel, onSaveDraft, onPublish }: JobPostingWizardProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = <K extends keyof WizardValues>(key: K, value: WizardValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep = (index: number): boolean => {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!values.title.trim()) next.title = 'Title is required.';
      if (!values.summary.trim()) next.summary = 'Summary is required.';
    }
    if (index === 1) {
      if (values.workArrangement !== 'remote' && !values.location.trim()) {
        next.location = 'Location is required for on-site or hybrid roles.';
      }
    }
    if (index === 3) {
      if (values.applicationMethod === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.applicationEmail)) {
        next.applicationEmail = 'A valid email is required for this application method.';
      }
      if (values.applicationMethod === 'external') {
        try {
          new URL(values.applicationUrl);
        } catch {
          next.applicationUrl = 'A valid URL is required for this application method.';
        }
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSaveDraft = async () => {
    setSaveError(null);
    setSaving(true);
    const ok = await onSaveDraft(values);
    setSaving(false);
    if (!ok) setSaveError('Could not save. Please try again.');
  };

  const handlePublish = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(3)) {
      setSaveError('Please fix the highlighted fields before publishing.');
      return;
    }
    setSaveError(null);
    setSaving(true);
    const ok = await onPublish(values);
    setSaving(false);
    if (!ok) setSaveError('Could not publish. Please try again.');
  };

  const previewPosting: JobPosting = {
    id: 'preview',
    title: values.title || 'Untitled role',
    department: values.department || null,
    location: values.location,
    category: values.category || null,
    industry: values.industry || null,
    employment_type: values.employmentType,
    work_arrangement: values.workArrangement,
    vacancies: Number(values.vacancies) || 1,
    summary: values.summary,
    responsibilities: values.responsibilities,
    requirements: values.requirements,
    preferred_requirements: values.preferredRequirements,
    qualifications: values.qualifications,
    min_experience_years: values.minExperienceYears ? Number(values.minExperienceYears) : null,
    education_level: values.educationLevel || null,
    languages: values.languages,
    salary_min: values.salaryMin ? Number(values.salaryMin) : null,
    salary_max: values.salaryMax ? Number(values.salaryMax) : null,
    salary_currency: values.salaryCurrency,
    salary_frequency: values.salaryFrequency || null,
    salary_public: values.salaryPublic,
    salary_negotiable: values.salaryNegotiable,
    benefits: values.benefits,
    working_hours: values.workingHours || null,
    start_date: values.startDate || null,
    opens_at: values.opensAt || null,
    closing_date: values.closingDate || null,
    required_documents: values.requiredDocuments,
    screening_questions: values.screeningQuestions,
    application_method: values.applicationMethod,
    application_email: values.applicationEmail || null,
    application_url: values.applicationUrl || null,
    application_instructions: values.applicationInstructions || null,
    recruiter_name: values.recruiterName || null,
    recruiter_email: values.recruiterEmail || null,
    recruiter_phone: values.recruiterPhone || null,
    status: 'draft',
    created_at: new Date().toISOString()
  };

  return (
    <div className="rounded-lg border border-hairline bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline p-5">
        {STEPS.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-semibold transition-colors duration-200 ${
                index === step ? 'bg-ink-900 text-white' : index < step ? 'bg-success-50 text-success-600' : 'bg-cream text-muted'
              }`}>
              {index < step ? <CheckIcon className="h-3 w-3" aria-hidden={true} /> : null}
              {index + 1}. {label}
            </button>
            {index < STEPS.length - 1 ? <span className="h-px w-4 bg-hairline" aria-hidden="true" /> : null}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 0 ? <StepBasicInfo values={values} set={set} errors={errors} /> : null}
        {step === 1 ? <StepEmploymentDetails values={values} set={set} errors={errors} /> : null}
        {step === 2 ? <StepRequirements values={values} set={set} /> : null}
        {step === 3 ? <StepApplicationSettings values={values} set={set} errors={errors} /> : null}
        {step === 4 ? (
          <div>
            <p className="mb-4 text-[0.8125rem] text-muted">This is exactly how the role will appear to applicants.</p>
            <div className="rounded-md border border-hairline bg-cream/30 p-6">
              <h2 className="font-display text-xl font-bold text-ink-900">{previewPosting.title}</h2>
              <JobPostingPreview posting={previewPosting} />
            </div>
          </div>
        ) : null}

        {saveError ? <p className="mt-4 text-[0.8125rem] text-error-600">{saveError}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-hairline pt-5">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
              Back
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700">
              Next
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          {step === STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving}
              className="rounded-md bg-success-600 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-success-600/90 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Publishing…' : 'Publish Job'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto text-[0.8125rem] font-medium text-muted transition-colors duration-200 hover:text-ink-900">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  values: WizardValues;
  set: <K extends keyof WizardValues>(key: K, value: WizardValues[K]) => void;
  errors?: Record<string, string>;
}

function StepBasicInfo({ values, set, errors }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={labelClass}>Job title *</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Site Safety Officer"
          className={inputClass} />
        {errors?.title ? <p className="mt-1 text-[0.75rem] text-error-600">{errors.title}</p> : null}
      </div>
      <div>
        <label className={labelClass}>Category</label>
        <input
          type="text"
          value={values.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="e.g. Health & Safety"
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Industry</label>
        <input
          type="text"
          value={values.industry}
          onChange={(e) => set('industry', e.target.value)}
          placeholder="e.g. Mining & Construction"
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Department</label>
        <input
          type="text"
          value={values.department}
          onChange={(e) => set('department', e.target.value)}
          placeholder="e.g. Operations"
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Number of vacancies</label>
        <input
          type="number"
          min={1}
          value={values.vacancies}
          onChange={(e) => set('vacancies', e.target.value)}
          className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Short summary *</label>
        <p className={helpClass}>A one or two sentence overview shown on the job cards.</p>
        <textarea
          rows={2}
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder="e.g. We're looking for an experienced Safety Officer to oversee compliance across our Rustenburg site."
          className={inputClass} />
        {errors?.summary ? <p className="mt-1 text-[0.75rem] text-error-600">{errors.summary}</p> : null}
      </div>
      <div className="sm:col-span-2">
        <RepeatableListField
          label="Key responsibilities & duties"
          items={values.responsibilities}
          onChange={(items) => set('responsibilities', items)}
          placeholder="Type a responsibility and press Add"
        />
      </div>
    </div>
  );
}

function StepEmploymentDetails({ values, set, errors }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Employment type</label>
        <select value={values.employmentType} onChange={(e) => set('employmentType', e.target.value)} className={inputClass}>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Work arrangement</label>
        <select
          value={values.workArrangement}
          onChange={(e) => set('workArrangement', e.target.value as WorkArrangement)}
          className={inputClass}>
          {WORK_ARRANGEMENTS.map((w) => (
            <option key={w} value={w}>
              {WORK_ARRANGEMENT_LABELS[w]}
            </option>
          ))}
        </select>
      </div>

      {values.workArrangement !== 'remote' ? (
        <div className="sm:col-span-2">
          <label className={labelClass}>Location *</label>
          <input type="text" value={values.location} onChange={(e) => set('location', e.target.value)} className={inputClass} />
          {errors?.location ? <p className="mt-1 text-[0.75rem] text-error-600">{errors.location}</p> : null}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <label className={labelClass}>Working hours</label>
        <input
          type="text"
          value={values.workingHours}
          onChange={(e) => set('workingHours', e.target.value)}
          placeholder="e.g. Monday–Friday, 08:00–17:00"
          className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Expected start date</label>
        <input type="date" value={values.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
      </div>

      <div className="sm:col-span-2 rounded-md border border-hairline bg-cream/30 p-4">
        <p className={labelClass}>Compensation</p>
        <div className="mt-3 flex flex-wrap items-center gap-5">
          <label className="flex items-center gap-2 text-[0.8125rem] text-ink-900">
            <input type="checkbox" checked={values.salaryNegotiable} onChange={(e) => set('salaryNegotiable', e.target.checked)} />
            Negotiable
          </label>
          <label className="flex items-center gap-2 text-[0.8125rem] text-ink-900">
            <input type="checkbox" checked={values.salaryPublic} onChange={(e) => set('salaryPublic', e.target.checked)} />
            Show salary publicly
          </label>
        </div>

        {!values.salaryNegotiable ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Min</label>
              <input type="number" value={values.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} placeholder="e.g. 15000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Max</label>
              <input type="number" value={values.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} placeholder="e.g. 22000" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <input type="text" value={values.salaryCurrency} onChange={(e) => set('salaryCurrency', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <select value={values.salaryFrequency} onChange={(e) => set('salaryFrequency', e.target.value)} className={inputClass}>
                {SALARY_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <RepeatableListField
          label="Benefits & additional compensation"
          items={values.benefits}
          onChange={(items) => set('benefits', items)}
          placeholder="e.g. Medical aid contribution"
        />
      </div>
    </div>
  );
}

function StepRequirements({ values, set }: StepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Minimum education level</label>
        <input
          type="text"
          value={values.educationLevel}
          onChange={(e) => set('educationLevel', e.target.value)}
          placeholder="e.g. National Diploma"
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Minimum years of experience</label>
        <input
          type="number"
          min={0}
          value={values.minExperienceYears}
          onChange={(e) => set('minExperienceYears', e.target.value)}
          className={inputClass} />
      </div>
      <div className="sm:col-span-2">
        <RepeatableListField
          label="Essential requirements"
          items={values.requirements}
          onChange={(items) => set('requirements', items)}
          placeholder="Must-have — e.g. SACPCMP registration"
        />
      </div>
      <div className="sm:col-span-2">
        <RepeatableListField
          label="Preferred requirements (nice to have)"
          items={values.preferredRequirements}
          onChange={(items) => set('preferredRequirements', items)}
          placeholder="e.g. Experience in mining sector"
        />
      </div>
      <div className="sm:col-span-2">
        <RepeatableListField
          label="Qualifications & certifications"
          items={values.qualifications}
          onChange={(items) => set('qualifications', items)}
          placeholder="e.g. SAMTRAC certificate"
        />
      </div>
      <div className="sm:col-span-2">
        <RepeatableListField
          label="Language requirements"
          items={values.languages}
          onChange={(items) => set('languages', items)}
          placeholder="e.g. English (fluent)"
        />
      </div>
    </div>
  );
}

function StepApplicationSettings({ values, set, errors }: StepProps) {
  const toggleDocument = (doc: DocumentType) => {
    if (values.requiredDocuments.includes(doc)) {
      if (doc === 'cv') return; // CV is always required
      set('requiredDocuments', values.requiredDocuments.filter((d) => d !== doc));
    } else {
      set('requiredDocuments', [...values.requiredDocuments, doc]);
    }
  };

  const addQuestion = () => {
    set('screeningQuestions', [
      ...values.screeningQuestions,
      { id: `q${Date.now()}`, label: '', type: 'yesno', required: true }
    ]);
  };

  const updateQuestion = (index: number, patch: Partial<ScreeningQuestion>) => {
    const next = values.screeningQuestions.map((q, i) => (i === index ? { ...q, ...patch } : q));
    set('screeningQuestions', next);
  };

  const removeQuestion = (index: number) => {
    set('screeningQuestions', values.screeningQuestions.filter((_, i) => i !== index));
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Application opening date</label>
          <input type="date" value={values.opensAt} onChange={(e) => set('opensAt', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Application closing date</label>
          <input type="date" value={values.closingDate} onChange={(e) => set('closingDate', e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Application method</label>
        <select value={values.applicationMethod} onChange={(e) => set('applicationMethod', e.target.value as WizardValues['applicationMethod'])} className={`${inputClass} max-w-xs`}>
          <option value="website">Apply through the website (recommended)</option>
          <option value="email">Apply via email</option>
          <option value="external">Apply via external link</option>
        </select>
        {values.applicationMethod === 'email' ? (
          <div className="mt-3 max-w-sm">
            <label className={labelClass}>Application email</label>
            <input
              type="email"
              value={values.applicationEmail}
              onChange={(e) => set('applicationEmail', e.target.value)}
              placeholder="careers@kamosa.co.za"
              className={inputClass} />
            {errors?.applicationEmail ? <p className="mt-1 text-[0.75rem] text-error-600">{errors.applicationEmail}</p> : null}
          </div>
        ) : null}
        {values.applicationMethod === 'external' ? (
          <div className="mt-3 max-w-sm">
            <label className={labelClass}>External application URL</label>
            <input
              type="url"
              value={values.applicationUrl}
              onChange={(e) => set('applicationUrl', e.target.value)}
              placeholder="https://..."
              className={inputClass} />
            {errors?.applicationUrl ? <p className="mt-1 text-[0.75rem] text-error-600">{errors.applicationUrl}</p> : null}
          </div>
        ) : null}
      </div>

      {values.applicationMethod === 'website' ? (
        <div>
          <label className={labelClass}>Required documents</label>
          <p className={helpClass}>CV is always required. Choose anything else applicants must attach.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DOCUMENT_TYPES.map((doc) => (
              <button
                key={doc}
                type="button"
                onClick={() => toggleDocument(doc)}
                disabled={doc === 'cv'}
                className={`rounded-full border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200 ${
                  values.requiredDocuments.includes(doc)
                    ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                    : 'border-hairline text-muted hover:bg-cream'
                } ${doc === 'cv' ? 'cursor-not-allowed opacity-70' : ''}`}>
                {DOCUMENT_TYPE_LABELS[doc]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {values.applicationMethod === 'website' ? (
        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>Screening questions</label>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-[0.75rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
              <PlusIcon className="h-3.5 w-3.5" aria-hidden={true} />
              Add question
            </button>
          </div>
          {values.screeningQuestions.length === 0 ? <p className={helpClass}>Optional — none configured.</p> : null}
          <div className="mt-2 space-y-3">
            {values.screeningQuestions.map((q, index) => (
              <div key={q.id} className="flex flex-wrap items-center gap-2 rounded-md border border-hairline bg-cream/30 p-3">
                <input
                  type="text"
                  value={q.label}
                  onChange={(e) => updateQuestion(index, { label: e.target.value })}
                  placeholder="e.g. Do you have a valid driver's license?"
                  className="min-w-[180px] flex-1 rounded-md border border-hairline bg-white px-3 py-1.5 text-[0.8125rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
                <select
                  value={q.type}
                  onChange={(e) => updateQuestion(index, { type: e.target.value as ScreeningQuestion['type'] })}
                  className="rounded-md border border-hairline bg-white px-2 py-1.5 text-[0.8125rem] text-ink-900">
                  <option value="yesno">Yes / No</option>
                  <option value="text">Short answer</option>
                </select>
                <label className="flex items-center gap-1.5 text-[0.75rem] text-ink-900">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(index, { required: e.target.checked })} />
                  Required
                </label>
                <button
                  type="button"
                  onClick={() => removeQuestion(index)}
                  aria-label="Remove question"
                  className="text-muted transition-colors duration-200 hover:text-error-600">
                  <TrashIcon className="h-4 w-4" aria-hidden={true} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className={labelClass}>Additional application instructions</label>
        <textarea
          rows={2}
          value={values.applicationInstructions}
          onChange={(e) => set('applicationInstructions', e.target.value)}
          placeholder="e.g. Please mention your earliest available start date in your cover letter."
          className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Recruiter name</label>
          <input
            type="text"
            value={values.recruiterName}
            onChange={(e) => set('recruiterName', e.target.value)}
            placeholder="e.g. Lovedonia Mmola"
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Recruiter email</label>
          <input
            type="email"
            value={values.recruiterEmail}
            onChange={(e) => set('recruiterEmail', e.target.value)}
            placeholder="info@kamosa.co.za"
            className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Recruiter phone</label>
          <input
            type="tel"
            value={values.recruiterPhone}
            onChange={(e) => set('recruiterPhone', e.target.value)}
            placeholder="071 191 4744"
            className={inputClass} />
        </div>
      </div>
    </div>
  );
}
