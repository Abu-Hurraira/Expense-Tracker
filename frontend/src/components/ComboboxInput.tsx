import { useId } from 'react';

interface ComboboxInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

export default function ComboboxInput({
  label,
  value,
  onChange,
  options,
  placeholder = 'Type or select...',
  required,
  hint,
}: ComboboxInputProps) {
  const listId = useId();

  return (
    <div className="mb-3">
      <label className="form-label fw-medium">{label}</label>
      <input
        type="text"
        className="form-control combobox-input"
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      <datalist id={listId}>
        {options.map(opt => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}
