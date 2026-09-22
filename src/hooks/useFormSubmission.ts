import { useRef, useState } from 'react';

/**
 * Generalizes the state machine ContactForm.tsx already managed inline (values / errors /
 * submitting / result, validate-then-submit, clear-on-success). Extracted per
 * docs/FRONTEND_ARCHITECTURE.md §4 so Phase 1's new fixed-field forms (request-service, the
 * profile-download lead form) don't duplicate it. Forms with conditional/dynamic field sets
 * (request-a-quote) use react-hook-form instead — see that doc for why the split.
 */
export function useFormSubmission<TValues, TResult extends { status: string }>(opts: {
  initial: TValues;
  validate: (values: TValues) => Partial<Record<keyof TValues, string>>;
  submit: (values: TValues) => Promise<TResult>;
  successStatus?: TResult['status'];
}) {
  const [values, setValues] = useState<TValues>(opts.initial);
  const [errors, setErrors] = useState<Partial<Record<keyof TValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TResult | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof TValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const nextValue = event.target.value;
    setValues((prev) => ({ ...prev, [key]: nextValue }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setField = <K extends keyof TValues>(key: K, value: TValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>, fieldIdPrefix: string) => {
    event.preventDefault();
    setResult(null);

    const nextErrors = opts.validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(`${fieldIdPrefix}-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    const outcome = await opts.submit(values);
    setSubmitting(false);
    setResult(outcome);

    const successStatus = opts.successStatus ?? ('sent' as TResult['status']);
    if (outcome.status === successStatus) setValues(opts.initial);
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  const describedBy = (key: keyof TValues) => (errors[key] ? `${String(key)}-error` : undefined);

  return { values, setValues, errors, submitting, result, update, setField, handleSubmit, describedBy, statusRef };
}
