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
          className={`text-[7px] px-3 py-1.5 border tracking-wide transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-amber disabled:opacity-40 disabled:cursor-not-allowed ${
            selected === i
              ? 'border-amber text-amber bg-amber/10'
              : 'border-border text-muted hover:border-amber/50 hover:text-body'
          }`}
          aria-pressed={selected === i}
          aria-label={`Scenario: ${s.label}`}
        >
          [{s.label}]
        </button>
      ))}
    </div>
  );
}
