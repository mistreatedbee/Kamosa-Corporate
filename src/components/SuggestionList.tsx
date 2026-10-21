/** A <datalist> of clickable suggestions for a text input (via `list={id}` on the input) — the
 * input still accepts free text, but clicking/focusing it shows these as a real selectable
 * dropdown rather than placeholder text that vanishes once you start typing. */
export function SuggestionList({ id, options }: { id: string; options: string[] }) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
}
