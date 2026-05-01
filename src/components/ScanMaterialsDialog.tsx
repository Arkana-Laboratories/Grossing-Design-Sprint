import { useState } from 'react';
import type { Case } from '../mock/types';
import { Button } from './ui/Button';

interface Props {
  caseData: Case;
  onClose: () => void;
  onScanComplete: () => void;
}

const sw = { strokeWidth: 2, stroke: 'currentColor', fill: 'none' } as const;

function CameraIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...sw}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  );
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
          <h2 className="text-[17px] font-semibold text-arkana-black">
            Scan bottle — {caseData.accessionNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-arkana-gray-400 hover:text-arkana-black text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-arkana-gray-50 transition"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="border-2 border-dashed border-arkana-gray-200 rounded-xl h-56 flex items-center justify-center text-arkana-gray-400 mb-5">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-xl bg-arkana-gray-50 flex items-center justify-center mx-auto mb-3 ${scanning ? 'animate-pulse' : ''}`}>
              <CameraIcon size={28} />
            </div>
            <div className="text-sm">
              {scanning ? 'Scanning…' : 'Point camera at bottle barcode'}
            </div>
          </div>
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
