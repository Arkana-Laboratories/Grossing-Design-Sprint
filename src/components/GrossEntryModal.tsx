import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { getCaseByAccession, mockCases } from '../mock/data';
import { useDemoPreset } from '../state/DemoPresetContext';
import { useCaseSession } from '../state/CaseSessionContext';

type Tab = 'scan' | 'lookup' | 'dictate';

const NATIVE_CASE  = getCaseByAccession('S26-10234') ?? mockCases[0]!;
const SPECIAL_CASE = getCaseByAccession('S26-12345') ?? mockCases[1]!;

interface Props { onClose: () => void }

const sw = { strokeWidth: 2, stroke: 'currentColor', fill: 'none' } as const;

function CameraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
}

function KeyboardIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h12"/>
    </svg>
  );
}

function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <rect x="9" y="2" width="6" height="11" rx="3"/>
      <path d="M5 10a7 7 0 0014 0M12 19v3M8 22h8"/>
    </svg>
  );
}

function FlaskIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <path d="M9 3h6m-6 0v7l-4 9h14l-4-9V3"/>
    </svg>
  );
}

function BeakerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <path d="M4.5 6h15M8 6v6l-4 6h16l-4-6V6"/>
    </svg>
  );
}

const tabs: { id: Tab; icon: (active: boolean) => React.ReactNode; label: string }[] = [
  { id: 'scan',    icon: (a) => <CameraIcon   size={14} />, label: 'Scan' },
  { id: 'lookup',  icon: (a) => <KeyboardIcon size={14} />, label: 'Look up' },
  { id: 'dictate', icon: (a) => <MicIcon      size={14} />, label: 'Dictate' },
];

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
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-arkana-gray-100">
          <h2 className="text-[17px] font-semibold text-arkana-black">Start Grossing</h2>
          <button
            onClick={onClose}
            className="text-arkana-gray-400 hover:text-arkana-black text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-arkana-gray-50 transition"
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
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition border ${
                tab === t.id
                  ? 'bg-arkana-red text-white border-arkana-red'
                  : 'border-arkana-gray-200 text-arkana-gray-500 hover:border-arkana-red hover:text-arkana-red'
              }`}
            >
              {t.icon(tab === t.id)}
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">

          {/* ── Scan ── */}
          {tab === 'scan' && (
            <div className="space-y-5">
              <div className="border-2 border-dashed border-arkana-gray-200 rounded-xl h-48 flex items-center justify-center text-arkana-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-arkana-gray-50 flex items-center justify-center mx-auto mb-3">
                    <CameraIcon size={24} />
                  </div>
                  <div className="text-sm">Point camera at bottle barcode</div>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-arkana-gray-400 mb-3">
                  Simulate scan
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('normal-case', NATIVE_CASE.accessionNumber)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-arkana-gray-200 hover:border-arkana-red hover:bg-arkana-red-light transition text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-arkana-green-light text-arkana-green flex items-center justify-center shrink-0">
                      <FlaskIcon size={18} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-arkana-black">Native Case</div>
                      <div className="text-[11px] text-arkana-gray-500">{NATIVE_CASE.accessionNumber}</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoSelect('special-case', SPECIAL_CASE.accessionNumber)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-arkana-gray-200 hover:border-arkana-red hover:bg-arkana-red-light transition text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-arkana-blue-light text-arkana-blue flex items-center justify-center shrink-0">
                      <BeakerIcon size={18} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-arkana-black">Special Case</div>
                      <div className="text-[11px] text-arkana-gray-500">{SPECIAL_CASE.accessionNumber}</div>
                    </div>
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
                Try: S26-12500 · S26-10234 · S26-12555
              </p>
            </form>
          )}

          {/* ── Dictate ── */}
          {tab === 'dictate' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-arkana-gray-500">
              <div className="w-16 h-16 rounded-2xl bg-arkana-gray-50 flex items-center justify-center">
                <MicIcon size={32} />
              </div>
              <p className="text-sm text-center max-w-xs text-arkana-gray-500">
                Voice accession lookup is coming soon. Use Look up or Scan to start a case.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
