/** A row of clickable suggestion chips — generalizes the pattern already proven in the Enquiries
 * detail panel's "Quick note templates" (see EnquiryDetailPanel.tsx) into a reusable component, so
 * every other field that wants clickable suggestions (not just placeholder text that vanishes on
 * focus) uses the same look, the same class names, and the same interaction model.
 *
 * The component only renders buttons — what clicking one DOES (append to a textarea, add to a
 * list, replace a select value, etc.) is entirely up to the caller's `onSelect`. This keeps it
 * usable for both "insert into free text" and "pick one of a few options" without two components. */
export function SuggestionChips({
  label,
  options,
  onSelect,
  disabled
}: {
  /** aria-label for the chip group — e.g. "Suggested responsibilities". Not rendered as visible text. */
  label: string;
  options: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          disabled={disabled}
          className="rounded-full border border-hairline bg-white px-2.5 py-1 text-[0.75rem] text-ink-900 transition-colors duration-200 hover:bg-[#F4F2F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50">
          {option.replace(/[:.]?\s*$/, '')}
        </button>
      ))}
    </div>
  );
}
