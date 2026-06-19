interface ScenarioPickerProps {
  scenarios: { label: string }[];
  selected: number;
  onSelect: (idx: number) => void;
  disabled?: boolean;
}

export function ScenarioPicker({ scenarios, selected, onSelect, disabled }: ScenarioPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Select demo scenario">
      {scenarios.map((s, i) => (
        <button
          key={s.label}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(i)}
          className={`text-xs px-4 py-1.5 rounded-full border transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber disabled:opacity-40 disabled:cursor-not-allowed ${
            selected === i
              ? 'border-amber text-amber bg-amber/10 font-medium'
              : 'border-border-2 text-muted hover:border-amber/40 hover:text-body'
          }`}
          aria-pressed={selected === i}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
