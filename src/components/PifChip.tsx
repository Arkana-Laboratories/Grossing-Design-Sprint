import { useEffect, useRef, useState } from 'react';
import { PIF_REASONS } from '../templates/renalIdf';

interface Props {
  isPif: boolean;
  reason: string | null;
  onSet: (reason: string) => void;
  onClear: () => void;
}

export function PifChip({ isPif, reason, onSet, onClear }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPickerOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setPickerOpen(false);
    }
    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [pickerOpen]);

  if (isPif) {
    return (
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 px-3 h-7 rounded-full border border-arkana-red bg-arkana-red-light text-arkana-red-dark text-[10px] font-bold uppercase tracking-wide hover:bg-arkana-red hover:text-white transition"
        title="Remove PIF flag"
      >
        <span>PIF</span>
        {reason && (
          <span className="font-medium normal-case tracking-normal">
            · {reason}
          </span>
        )}
        <span className="text-base leading-none ml-0.5" aria-hidden>
          ×
        </span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setPickerOpen((o) => !o)}
        className="inline-flex items-center gap-1 px-3 h-7 rounded-full border border-arkana-gray-200 bg-white text-arkana-gray-500 text-[10px] font-bold uppercase tracking-wide hover:border-arkana-red hover:text-arkana-red transition"
      >
        Mark as PIF
      </button>
      {pickerOpen && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-arkana-gray-200 rounded-xl shadow-lg p-1.5 w-56">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide font-bold text-arkana-gray-500">
            Reason
          </div>
          {PIF_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                onSet(r);
                setPickerOpen(false);
              }}
              className="block w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-arkana-gray-50 text-arkana-black"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
