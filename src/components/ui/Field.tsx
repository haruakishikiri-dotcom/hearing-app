import type { Question } from '../../types';

const MULTI_SEP = '||';

interface Props {
  q: Question;
  value: string;
  onChange: (v: string) => void;
}

export function Field({ q, value, onChange }: Props) {
  if (q.kind === 'longtext') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full rounded-xl border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        placeholder="ご自由にご記入ください"
      />
    );
  }
  if (q.kind === 'number') {
    return (
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
      />
    );
  }
  if (q.kind === 'select' && q.options) {
    return (
      <div className="flex flex-wrap gap-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-2 rounded-xl text-sm border transition ${
              value === opt
                ? 'bg-brand-500 border-brand-500 text-white shadow-soft'
                : 'bg-white border-ink-300 text-ink-700 hover:border-brand-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }
  if (q.kind === 'multiselect' && q.options) {
    const selected = new Set(value ? value.split(MULTI_SEP) : []);
    return (
      <div className="flex flex-wrap gap-2">
        {q.options.map((opt) => {
          const on = selected.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                if (on) selected.delete(opt);
                else selected.add(opt);
                onChange(Array.from(selected).join(MULTI_SEP));
              }}
              className={`px-3 py-2 rounded-xl text-sm border transition ${
                on
                  ? 'bg-brand-500 border-brand-500 text-white shadow-soft'
                  : 'bg-white border-ink-300 text-ink-700 hover:border-brand-300'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
    />
  );
}

export function displayValue(v: string): string {
  if (!v) return '';
  if (v.includes(MULTI_SEP)) return v.split(MULTI_SEP).join(' / ');
  return v;
}
