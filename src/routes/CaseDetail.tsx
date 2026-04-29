import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import type { Preservative, QualityFlag } from '../mock/types';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';
import { Button } from '../components/ui/Button';
import { ScanMaterialsDialog } from '../components/ScanMaterialsDialog';
import { useToast } from '../components/ToastHost';

const flagLabel: Record<QualityFlag, string> = {
  fatty: 'Fatty',
  bloody: 'Bloody',
  no_pw: 'No paperwork',
  materials_not_labeled: 'Materials not labeled',
  bottle_leaked: 'Bottle leaked',
  damaged_items: 'Damaged items',
};

const flagVariant: Record<QualityFlag, 'warning' | 'danger'> = {
  fatty: 'warning',
  bloody: 'warning',
  no_pw: 'danger',
  materials_not_labeled: 'danger',
  bottle_leaked: 'danger',
  damaged_items: 'danger',
};

const preservativeLabel: Record<Preservative, string> = {
  formalin: 'Formalin',
  michels: "Michel's",
  glutaraldehyde: 'Glutaraldehyde',
};

const preservativeVariant: Record<Preservative, 'info' | 'neutral' | 'success'> = {
  formalin: 'info',
  michels: 'neutral',
  glutaraldehyde: 'success',
};

export function CaseDetail() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [scanOpen, setScanOpen] = useState(false);
  const [activity, setActivity] = useState<string[]>([]);

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-arkana-black mb-2">
          Case not found
        </h2>
        <p className="text-arkana-gray-500 mb-6">
          We couldn't find case {accessionNumber}.
        </p>
        <Link to="/search">
          <Button variant="primary">Back to search</Button>
        </Link>
      </div>
    );
  }

  function handleScanComplete() {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    setActivity((prev) => [`Bottle scanned — ${time}`, ...prev]);
    navigate(`/case/${caseData!.accessionNumber}/verify`);
  }

  function handleReprint() {
    toast({ message: 'Sent labels to printer (Bench 3)', variant: 'info' });
  }

  return (
    <div className="space-y-5">
      {caseData.priorCaseAccession && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="text-sm text-arkana-black">
              <span className="font-medium">Prior case:</span>{' '}
              {caseData.priorCaseAccession} — age change, CR needed
            </div>
            <Tag variant="warning">Review</Tag>
          </div>
        </Card>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-arkana-black">
            {caseData.accessionNumber}
          </h1>
          <p className="text-arkana-gray-500 mt-1">
            {caseData.patient.firstName} {caseData.patient.lastName} · MRN{' '}
            {caseData.patient.medicalRecordNumber}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setScanOpen(true)}>
            Scan Materials
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate(`/case/${caseData.accessionNumber}/gross`)}
          >
            Start Grossing
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card title="Received Materials" className="md:col-span-2">
          <ul className="divide-y divide-arkana-gray-200">
            {caseData.materials.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <div className="text-arkana-black font-medium">{m.label}</div>
                    <div className="text-xs text-arkana-gray-500 mt-0.5">
                      <Tag variant={preservativeVariant[m.preservative]}>
                        {preservativeLabel[m.preservative]}
                      </Tag>
                    </div>
                  </div>
                </div>
                {!m.isLabeled && <Tag variant="danger">Not labeled</Tag>}
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="ghost" onClick={handleReprint}>
              🖨 Reprint labels
            </Button>
          </div>
        </Card>

        <Card title="Panels">
          <div className="space-y-4">
            <Stat label="# of Cores" value={caseData.panels.numberOfCores} />
            <Stat label="LN" value={caseData.panels.lymphNodeCount} />
            <Stat label="IF" value={caseData.panels.immunofluorescenceCount} />
          </div>
        </Card>
      </div>

      <Card title="Flags">
        {caseData.flags.length === 0 ? (
          <p className="text-arkana-gray-500 text-sm">No flags.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {caseData.flags.map((f) => (
              <Tag key={f} variant={flagVariant[f]}>
                {flagLabel[f]}
              </Tag>
            ))}
          </div>
        )}
      </Card>

      <Card title="Activity">
        {activity.length === 0 ? (
          <p className="text-arkana-gray-500 text-sm">
            Activity will appear here as you work the case.
          </p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a, idx) => (
              <li key={idx} className="text-sm text-arkana-black">
                {a}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {scanOpen && (
        <ScanMaterialsDialog
          caseData={caseData}
          onClose={() => setScanOpen(false)}
          onScanComplete={handleScanComplete}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-3xl font-semibold text-arkana-black">{value}</div>
      <div className="text-xs uppercase tracking-wide text-arkana-gray-500 mt-1">{label}</div>
    </div>
  );
}
