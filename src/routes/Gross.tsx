import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ScanMaterialsDialog } from '../components/ScanMaterialsDialog';
import { mockCases, getCaseByAccession } from '../mock/data';

type Mode = 'choose' | 'input';

const DEFAULT_SCAN_CASE = mockCases[0]!;

export function Gross() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('choose');
  const [scanOpen, setScanOpen] = useState(false);
  const [accessionInput, setAccessionInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleScanComplete() {
    navigate(`/case/${DEFAULT_SCAN_CASE.accessionNumber}/verify`);
  }

  function handleInputSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = accessionInput.trim();
    if (!trimmed) {
      setError('Enter an accession number to continue.');
      return;
    }
    const found = getCaseByAccession(trimmed);
    if (!found) {
      setError(`No case found for "${trimmed}".`);
      return;
    }
    setError(null);
    navigate(`/case/${found.accessionNumber}/verify`);
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-arkana-black mt-1">Start Grossing</h1>
        <p className="text-arkana-gray-500 mt-1">Choose how you want to begin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setScanOpen(true)}
          className="bg-white rounded-2xl border border-arkana-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-sky-400 hover:shadow-md active:scale-[0.98] transition"
        >
          <div className="text-6xl mb-4">📷</div>
          <div className="text-lg text-arkana-black font-semibold">Scan</div>
          <div className="text-sm text-arkana-gray-500 mt-1">
            Scan a bottle barcode to begin intake
          </div>
        </button>

        <button
          onClick={() => setMode((prev) => (prev === 'input' ? 'choose' : 'input'))}
          className={`bg-white rounded-2xl border p-8 flex flex-col items-center justify-center text-center min-h-[220px] hover:shadow-md active:scale-[0.98] transition ${
            mode === 'input' ? 'border-sky-400' : 'border-arkana-gray-200 hover:border-sky-400'
          }`}
        >
          <div className="text-6xl mb-4">⌨️</div>
          <div className="text-lg text-arkana-black font-semibold">Input</div>
          <div className="text-sm text-arkana-gray-500 mt-1">
            Enter the accession number manually
          </div>
        </button>
      </div>

      {mode === 'input' && (
        <Card className="mt-5">
          <form onSubmit={handleInputSubmit}>
            <label className="block text-xs uppercase tracking-wide font-bold text-arkana-gray-500 mb-2">
              Accession #
            </label>
            <div className="flex gap-3">
              <input
                autoFocus
                type="text"
                value={accessionInput}
                onChange={(e) => {
                  setAccessionInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. S26-12500"
                className="flex-1 h-12 rounded-xl border border-arkana-gray-200 px-4 focus:outline-none focus:ring-2 focus:ring-arkana-red"
              />
              <Button type="submit" variant="primary">
                Continue
              </Button>
            </div>
            {error && (
              <p className="text-sm text-rose-600 mt-2" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-arkana-gray-500 mt-3">
              Try: S26-12500, S26-12533, S26-12555
            </p>
          </form>
        </Card>
      )}

      {scanOpen && (
        <ScanMaterialsDialog
          caseData={DEFAULT_SCAN_CASE}
          onClose={() => setScanOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
}
