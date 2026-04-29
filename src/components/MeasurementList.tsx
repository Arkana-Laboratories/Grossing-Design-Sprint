import { useState, type FormEvent } from 'react';
import {
  parse,
  serialize,
  formatMeasurement,
  totalCount,
  exact,
  range,
  type DimRange,
  type Measurement,
} from '../lib/measurements';

interface Props {
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  fragmentNoun?: string;
}

const DIM_LABELS = ['L', 'W', 'D'];
const EMPTY_TRIPLE = ['', '', ''] as [string, string, string];

// When a single Add entry has this many pieces or more, the L (length)
// dimension switches to a min/max range. W and D stay exact regardless.
const RANGE_COUNT_THRESHOLD = 5;

export function MeasurementList({
  value,
  onChange,
  unit = 'cm',
  fragmentNoun = 'piece',
}: Props) {
  const measurements = parse(value);
  const total = totalCount(measurements);

  const [adding, setAdding] = useState(false);
  const [draftCount, setDraftCount] = useState('1');
  const [mins, setMins] = useState<[string, string, string]>(EMPTY_TRIPLE);
  const [lengthMax, setLengthMax] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countNum = Number(draftCount);
  const useLengthRange =
    Number.isFinite(countNum) && countNum >= RANGE_COUNT_THRESHOLD;

  function handleRemove(idx: number) {
    onChange(serialize(measurements.filter((_, i) => i !== idx)));
  }

  function resetDraft() {
    setDraftCount('1');
    setMins(EMPTY_TRIPLE);
    setLengthMax('');
    setError(null);
  }

  function setMinAt(idx: number, v: string) {
    setMins((prev) => {
      const next = [...prev] as [string, string, string];
      next[idx] = v;
      return next;
    });
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(countNum) || countNum < 1) {
      setError('Count must be a positive number.');
      return;
    }

    const lMin = Number(mins[0]);
    const wVal = Number(mins[1]);
    const dVal = Number(mins[2]);

    if (!Number.isFinite(lMin) || lMin <= 0) {
      setError(`Length: ${useLengthRange ? 'min is required.' : 'value is required.'}`);
      return;
    }
    if (!Number.isFinite(wVal) || wVal <= 0) {
      setError('Width: value is required.');
      return;
    }
    if (!Number.isFinite(dVal) || dVal <= 0) {
      setError('Depth: value is required.');
      return;
    }

    let lengthDim: DimRange;
    if (useLengthRange) {
      const lMax = Number(lengthMax);
      if (!Number.isFinite(lMax) || lMax <= 0) {
        setError('Length: max is required when count is 5 or more.');
        return;
      }
      lengthDim = range(lMin, lMax);
    } else {
      lengthDim = exact(lMin);
    }

    const next: Measurement = {
      count: countNum,
      dimensions: [lengthDim, exact(wVal), exact(dVal)],
    };
    onChange(serialize([...measurements, next]));
    resetDraft();
    setAdding(false);
  }

  function pluralize(n: number) {
    return `${n} ${fragmentNoun}${n === 1 ? '' : 's'}`;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-xs uppercase tracking-wide font-bold text-arkana-gray-500">
          Measurements
          <span className="ml-1 normal-case tracking-normal font-normal text-arkana-gray-500">
            ({unit})
          </span>
          {measurements.length > 0 && (
            <span className="ml-2 normal-case tracking-normal font-normal text-arkana-gray-500">
              · {pluralize(total)}
            </span>
          )}
        </label>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              resetDraft();
              setAdding(true);
            }}
            className="text-xs font-bold text-arkana-red hover:text-arkana-red-dark"
          >
            + Add measurement
          </button>
        )}
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col gap-2 p-3 mb-3 rounded-xl border border-arkana-gray-200 bg-arkana-gray-50/40"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <input
              type="number"
              min={1}
              step={1}
              value={draftCount}
              onChange={(e) => setDraftCount(e.target.value)}
              className="w-14 h-10 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-center font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-arkana-red"
              aria-label="Count"
              placeholder="#"
            />
            <span className="text-arkana-gray-500 text-sm font-bold" aria-hidden>
              @
            </span>

            {/* Length — exact below threshold, range at threshold or above */}
            <input
              type="number"
              step="0.01"
              min={0}
              value={mins[0]}
              onChange={(e) => setMinAt(0, e.target.value)}
              className="w-20 h-10 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-arkana-red"
              aria-label={useLengthRange ? 'Length min' : 'Length'}
              placeholder={useLengthRange ? 'L min' : 'L'}
            />
            {useLengthRange && (
              <>
                <span className="text-arkana-gray-500 text-sm" aria-hidden>
                  –
                </span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={lengthMax}
                  onChange={(e) => setLengthMax(e.target.value)}
                  className="w-20 h-10 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-arkana-red"
                  aria-label="Length max"
                  placeholder="L max"
                />
              </>
            )}
            <span className="text-arkana-gray-500 text-sm" aria-hidden>x</span>

            {/* Width — always exact */}
            <input
              type="number"
              step="0.01"
              min={0}
              value={mins[1]}
              onChange={(e) => setMinAt(1, e.target.value)}
              className="w-20 h-10 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-arkana-red"
              aria-label="Width"
              placeholder="W"
            />
            <span className="text-arkana-gray-500 text-sm" aria-hidden>x</span>

            {/* Depth — always exact */}
            <input
              type="number"
              step="0.01"
              min={0}
              value={mins[2]}
              onChange={(e) => setMinAt(2, e.target.value)}
              className="w-20 h-10 rounded-lg border border-arkana-gray-200 bg-white px-2 text-sm text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-arkana-red"
              aria-label="Depth"
              placeholder="D"
            />

            <span className="text-arkana-gray-500 text-xs ml-1">{unit}</span>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-arkana-red text-white text-xs font-bold tracking-tight hover:bg-arkana-red-dark"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                resetDraft();
                setAdding(false);
              }}
              className="h-10 px-3 rounded-lg border border-arkana-gray-200 bg-white text-arkana-black text-xs font-bold tracking-tight hover:bg-arkana-gray-50"
            >
              Cancel
            </button>
          </div>
          {useLengthRange && (
            <p className="text-[11px] text-arkana-gray-500">
              Length is now a range (count ≥ {RANGE_COUNT_THRESHOLD}).
            </p>
          )}
          {error && (
            <p className="text-xs text-arkana-red" role="alert">
              {error}
            </p>
          )}
        </form>
      )}

      {measurements.length === 0 ? (
        <p className="text-sm text-arkana-gray-500 italic">
          No measurements yet — dictate or add manually.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {measurements.map((m, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 pl-3 pr-1 h-8 rounded-full bg-arkana-gray-50 border border-arkana-gray-200 text-sm text-arkana-black"
            >
              <span className="font-medium tabular-nums">
                {formatMeasurement(m)}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="ml-0.5 w-6 h-6 rounded-full text-arkana-gray-500 hover:text-arkana-red hover:bg-arkana-red-light flex items-center justify-center text-lg leading-none transition"
                aria-label="Remove measurement"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
