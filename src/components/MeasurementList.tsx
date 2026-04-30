import { useState, type FormEvent } from 'react';
import {
  parse,
  serialize,
  formatMeasurement,
  totalCount,
  hasThinDimension,
  isExact,
  exact,
  range,
  type DimRange,
  type Measurement,
} from '../lib/measurements';
import { DescriptorChips } from './DescriptorChips';
import type { TissueDescriptor } from '../templates/descriptors';

interface Props {
  value: string;
  onChange: (next: string) => void;
  unit?: string;
  fragmentNoun?: string;
}

const EMPTY_TRIPLE = ['', '', ''] as [string, string, string];

export function MeasurementList({
  value,
  onChange,
  unit = 'cm',
  fragmentNoun = 'piece',
}: Props) {
  const measurements = parse(value);
  const total = totalCount(measurements);

  const [adding, setAdding] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [forceRange, setForceRange] = useState(false);
  const [draftCount, setDraftCount] = useState('1');
  const [mins, setMins] = useState<[string, string, string]>(EMPTY_TRIPLE);
  const [lengthMax, setLengthMax] = useState('');
  const [error, setError] = useState<string | null>(null);

  const countNum = Number(draftCount);
  const useLengthRange = forceRange;

  function startEdit(idx: number) {
    const m = measurements[idx];
    if (!m) return;
    const lenDim = m.dimensions[0]!;
    const wDim = m.dimensions[1]!;
    const dDim = m.dimensions[2]!;
    setEditingIdx(idx);
    setDraftCount(String(m.count));
    setMins([String(lenDim.min), String(wDim.min), String(dDim.min)]);
    setLengthMax(isExact(lenDim) ? '' : String(lenDim.max));
    setForceRange(!isExact(lenDim));
    setError(null);
    setAdding(false);
  }

  function toggleDescriptorAt(idx: number, descriptor: TissueDescriptor) {
    const m = measurements[idx];
    if (!m) return;
    const has = m.descriptors.includes(descriptor);
    const next: Measurement = {
      ...m,
      descriptors: has
        ? m.descriptors.filter((d) => d !== descriptor)
        : [...m.descriptors, descriptor],
    };
    const updated = measurements.map((mm, i) => (i === idx ? next : mm));
    onChange(serialize(updated));
  }

  function resetDraft() {
    setDraftCount('1');
    setMins(EMPTY_TRIPLE);
    setLengthMax('');
    setError(null);
    setEditingIdx(null);
    setForceRange(false);
  }

  function setMinAt(dimIdx: number, v: string) {
    setMins((prev) => {
      const next = [...prev] as [string, string, string];
      next[dimIdx] = v;
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
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
        setError('Length: max is required.');
        return;
      }
      lengthDim = range(lMin, lMax);
    } else {
      lengthDim = exact(lMin);
    }

    const dims: DimRange[] = [lengthDim, exact(wVal), exact(dVal)];

    if (editingIdx !== null) {
      const existing = measurements[editingIdx]!;
      const updated: Measurement = { count: countNum, dimensions: dims, descriptors: existing.descriptors };
      onChange(serialize(measurements.map((m, i) => (i === editingIdx ? updated : m))));
    } else {
      const isThin = hasThinDimension({ count: countNum, dimensions: dims, descriptors: [] });
      const next: Measurement = {
        count: countNum,
        dimensions: dims,
        descriptors: isThin ? ['thin'] : [],
      };
      onChange(serialize([...measurements, next]));
      setAdding(false);
    }
    resetDraft();
  }

  function pluralize(n: number) {
    return `${n} ${fragmentNoun}${n === 1 ? '' : 's'}`;
  }

  function renderForm() {
    return (
      <form
        onSubmit={handleSubmit}
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
          {useLengthRange ? (
            <>
              <span className="text-arkana-gray-500 text-sm" aria-hidden>–</span>
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
              <button
                type="button"
                onClick={() => { setForceRange(false); setLengthMax(''); }}
                className="h-6 px-2 rounded-full border border-arkana-red bg-red-50 text-arkana-red text-[11px] font-bold leading-none"
                aria-label="Switch to exact length"
              >
                exact
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setForceRange(true)}
              className="h-6 px-2 rounded-full border border-arkana-gray-300 bg-white text-arkana-gray-500 text-[11px] font-bold leading-none hover:border-arkana-red hover:text-arkana-red"
              aria-label="Switch to length range"
            >
              range
            </button>
          )}
          <span className="text-arkana-gray-500 text-sm" aria-hidden>x</span>

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
            {editingIdx !== null ? 'Save' : 'Add'}
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
          <p className="text-[11px] text-arkana-gray-500">Length is a range — enter min and max.</p>
        )}
        {error && (
          <p className="text-xs text-arkana-red" role="alert">
            {error}
          </p>
        )}
      </form>
    );
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
        {!adding && editingIdx === null && (
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

      {adding && renderForm()}

      {measurements.length === 0 ? (
        <p className="text-sm text-arkana-gray-500 italic">
          No measurements yet — dictate or add manually.
        </p>
      ) : (
        <div className="space-y-2">
          {measurements.map((m, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,260px)_1fr] gap-3 md:gap-4 items-start"
            >
              {editingIdx === idx ? (
                <div className="md:col-span-2">{renderForm()}</div>
              ) : (
                <>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="inline-flex items-center pl-3 pr-3 h-8 rounded-full bg-arkana-gray-50 border border-arkana-gray-200 text-sm text-arkana-black w-full hover:border-arkana-red hover:bg-red-50 transition text-left"
                      aria-label={`Edit measurement ${formatMeasurement(m)}`}
                    >
                      <span className="font-medium tabular-nums flex-1 truncate">
                        {formatMeasurement(m)}
                      </span>
                    </button>
                  </div>
                  <DescriptorChips
                    selected={m.descriptors as TissueDescriptor[]}
                    onToggle={(v) => toggleDescriptorAt(idx, v)}
                    hideLabel
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
