import { useState } from 'react';
import type { Case } from '../mock/types';
import { Button } from './ui/Button';

interface Props {
  caseData: Case;
  onClose: () => void;
  onScanComplete: () => void;
}

export function ScanMaterialsDialog({ caseData, onClose, onScanComplete }: Props) {
  const [scanning, setScanning] = useState(false);

  function handleSimulateScan() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onScanComplete();
      onClose();
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-arkana-black">
            Scan bottle — {caseData.accessionNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-arkana-gray-500 hover:text-arkana-black text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-2 border-dashed border-arkana-gray-200 rounded-2xl h-64 flex items-center justify-center text-arkana-gray-500 mb-5">
          {scanning ? (
            <div className="text-center">
              <div className="text-4xl mb-2 animate-pulse">📷</div>
              <div>Scanning…</div>
            </div>
          ) : (
            <div className="text-center px-4">
              <div className="text-4xl mb-2">📷</div>
              <div>Point camera at bottle barcode</div>
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSimulateScan}
          disabled={scanning}
        >
          {scanning ? 'Scanning…' : 'Simulate scan'}
        </Button>
      </div>
    </div>
  );
}
