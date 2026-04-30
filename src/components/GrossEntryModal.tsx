import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { getCaseByAccession, mockCases } from '../mock/data';
import { useDemoPreset } from '../state/DemoPresetContext';
import { useCaseSession } from '../state/CaseSessionContext';

type Tab = 'scan' | 'lookup' | 'dictate';

const NATIVE_CASE = getCaseByAccession('S26-10234') ?? mockCases[0]!;
const SPECIAL_CASE = getCaseByAccession('S26-12345') ?? mockCases[1]!;

interface Props {
  onClose: () => void;
}

export function GrossEntryModal({ onClose }: Props) {
  const navigate = useNavigate();
  const { setActivePresetId } = useDemoPreset();
  const { clearSession } = useCaseSession();

  const [tab, setTab] = useState<Tab>('scan');
  const [accessionInput, setAccessionInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  function handleLookupSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = accessionInput.trim();
    if (!trimmed) { setLookupError('Enter an accession number.'); return; }
    const found = getCaseByAccession(trimmed);
    if (!found) { setLookupError(`No case found for "${trimmed}".`); return; }
    clearSession();
    onClose();
    navigate(`/case/${found.accessionNumber}/verify`);
  }

  function handleDemoSelect(presetId: string, caseAccession: string) {
    clearSession();
    setActivePresetId(presetId);
    onClose();
    navigate(`/case/${caseAccession}/verify`);
  }

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'scan',    icon: '📷', label: 'Scan' },
    { id: 'lookup',  icon: '⌨️', label: 'Look up' },
    { id: 'dictate', icon: '🎤', label: 'Dictate' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-arkana-gray-100">
          <h2 className="text-xl font-semibold text-arkana-black">Start Grossing</h2>
          <button
            onClick={onClose}
            className="text-arkana-gray-400 hover:text-arkana-black text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${
                tab === t.id
                  ? 'bg-arkana-red text-white border-arkana-red'
                  : 'border-arkana-gray-200 text-arkana-gray-500 hover:border-arkana-red hover:text-arkana-red'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">

          {/* ── Scan ── */}
          {tab === 'scan' && (
            <div className="space-y-5">
              <div className="border-2 border-dashed border-arkana-gray-200 rounded-2xl h-52 flex items-center justify-center text-arkana-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">📷</div>
                  <div className="text-sm">Point camera at bottle barcode</div>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide font-bold text-arkana-gray-400 mb-3">
                  Simulate scan
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('normal-case', NATIVE_CASE.accessionNumber)}
                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-arkana-gray-200 hover:border-arkana-red hover:bg-red-50 transition text-center"
                  >
                    <span className="text-3xl">🔬</span>
                    <span className="text-sm font-semibold text-arkana-black">Native Case</span>
                    <span className="text-xs text-arkana-gray-500">{NATIVE_CASE.accessionNumber}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('special-case', SPECIAL_CASE.accessionNumber)}
                    className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-arkana-gray-200 hover:border-arkana-red hover:bg-red-50 transition text-center"
                  >
                    <span className="text-3xl">🧪</span>
                    <span className="text-sm font-semibold text-arkana-black">Special Case</span>
                    <span className="text-xs text-arkana-gray-500">{SPECIAL_CASE.accessionNumber}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Look up ── */}
          {tab === 'lookup' && (
            <form onSubmit={handleLookupSubmit} className="space-y-4">
              <p className="text-sm text-arkana-gray-500">
                Type an accession number to open the grossing form directly.
              </p>
              <div className="flex gap-3">
                <input
                  autoFocus
                  type="text"
                  value={accessionInput}
                  onChange={(e) => { setAccessionInput(e.target.value); setLookupError(null); }}
                  placeholder="e.g. S26-12500"
                  className="flex-1 h-12 rounded-xl border border-arkana-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-arkana-red"
                />
                <Button type="submit" variant="primary">Continue</Button>
              </div>
              {lookupError && (
                <p className="text-sm text-rose-600" role="alert">{lookupError}</p>
              )}
              <p className="text-xs text-arkana-gray-400">
                Try: S26-12500 · S26-12533 · S26-12555
              </p>
            </form>
          )}

          {/* ── Dictate ── */}
          {tab === 'dictate' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-arkana-gray-500">
              <div className="text-6xl">🎤</div>
              <p className="text-sm text-center max-w-xs">
                Voice accession lookup is coming soon. Use Look up or Scan to start a case.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
