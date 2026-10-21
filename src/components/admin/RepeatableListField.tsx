import { useId, useState, type KeyboardEvent } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';

interface RepeatableListFieldProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  helpText?: string;
  /** Common options shown as a real clickable <datalist> dropdown — free text still works. */
  suggestions?: string[];
}

/** Add/remove one entry at a time — the spec's own ask is "no complicated formatting," so this
 * replaces the earlier plain one-per-line textarea with a real list UI for the fields admins are
 * most likely to build up incrementally (requirements, benefits, qualifications, languages). */
export function RepeatableListField({ label, items, onChange, placeholder, helpText, suggestions }: RepeatableListFieldProps) {
  const [draft, setDraft] = useState('');
  const listId = useId();

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft('');
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  };

  return (
    <div>
      <label className="text-[0.8125rem] font-semibold text-ink-900">{label}</label>
      {helpText ? <p className="mt-1 text-[0.75rem] text-muted">{helpText}</p> : null}

      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-center justify-between gap-2 rounded-md border border-hairline bg-cream/40 px-3 py-1.5 text-[0.8125rem] text-ink-900">
              <span>{item}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${item}`}
                className="shrink-0 text-muted transition-colors duration-200 hover:text-error-600">
                <XIcon className="h-3.5 w-3.5" aria-hidden={true} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-2 flex gap-2">
        <input
          type="text"
          list={suggestions ? listId : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
        {suggestions ? (
          <datalist id={listId}>
            {suggestions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        ) : null}
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50">
          <PlusIcon className="h-3.5 w-3.5" aria-hidden={true} />
          Add
        </button>
      </div>
    </div>
  );
}
