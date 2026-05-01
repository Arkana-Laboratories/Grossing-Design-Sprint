import { Link, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { useCaseSession } from '../state/CaseSessionContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import {
  RenalReadonlyView,
  NeuroReadonlyView,
  SummaryRow,
} from '../components/IdfReadonlyView';
import { useToast } from '../components/ToastHost';
import type { CaseStatus, Preservative } from '../mock/types';

const statusVariant: Record<CaseStatus, 'info' | 'warning' | 'neutral' | 'success'> = {
  intake: 'info',
  in_grossing: 'warning',
  submitted: 'neutral',
  finalized: 'success',
};

const preservativeLabel: Record<Preservative, string> = {
  formalin: 'Formalin',
  michels: "Michel's",
  glutaraldehyde: 'Glutaraldehyde',
};

export function EmFinal() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { getSubmittedIdf } = useCaseSession();
  const toast = useToast();

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3" aria-hidden>
          ⚠️
        </div>
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

  const submittedEntry = getSubmittedIdf(caseData.accessionNumber);
  const sessionMatchesCase = submittedEntry && submittedEntry.panelType === caseData.panelType;

  function handleExport() {
    toast({ message: 'Sent to PDF queue', variant: 'info' });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/search"
        className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline"
      >
        ← Back to search
      </Link>

      <div className="mt-3 flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Tag variant="neutral">EM Final</Tag>
            <Tag variant={caseData.panelType === 'renal' ? 'info' : 'success'}>
              {caseData.caseType}
            </Tag>
            <Tag variant={statusVariant[caseData.status]}>
              {caseData.status.replace(/_/g, ' ')}
            </Tag>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-arkana-black">
            {caseData.accessionNumber}
          </h1>
          <p className="text-arkana-gray-500 text-sm mt-0.5">
            {caseData.patient.lastName}, {caseData.patient.firstName}
          </p>
        </div>
        <Button variant="secondary" onClick={handleExport}>
          🖨 Print / Export
        </Button>
      </div>

      <Card title="Received Materials" className="mb-5">
        {caseData.materials.length === 0 ? (
          <p className="text-sm text-arkana-gray-500 italic">No materials.</p>
        ) : (
          <ul className="divide-y divide-arkana-gray-200">
            {caseData.materials.map((m) => (
              <li
                key={m.id}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span aria-hidden>🧪</span>
                  <div>
                    <div className="text-sm text-arkana-black font-medium">
                      {m.label}
                    </div>
                    <div className="mt-1">
                      <Tag
                        variant={
                          m.preservative === 'formalin'
                            ? 'info'
                            : m.preservative === 'glutaraldehyde'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {preservativeLabel[m.preservative]}
                      </Tag>
                    </div>
                  </div>
                </div>
                {!m.isLabeled && <Tag variant="danger">Not labeled</Tag>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Panels" className="mb-5">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <SummaryRow label="# of Cores">{caseData.panels.numberOfCores}</SummaryRow>
          <SummaryRow label="LN">{caseData.panels.lymphNodeCount}</SummaryRow>
          <SummaryRow label="IF">{caseData.panels.immunofluorescenceCount}</SummaryRow>
        </div>
      </Card>

      {!sessionMatchesCase && (
        <Card className="mb-5">
          <p className="text-sm text-arkana-gray-500 italic">
            No live grossing session for this case — IDF fields below are blank.
            Run the case through the grossing flow to populate them.
          </p>
        </Card>
      )}

      {sessionMatchesCase && submittedEntry.panelType === 'renal' && (
        <RenalReadonlyView idf={submittedEntry.idf} caseData={caseData} />
      )}
      {sessionMatchesCase && submittedEntry.panelType === 'neuro' && (
        <NeuroReadonlyView idf={submittedEntry.idf} caseData={caseData} />
      )}

      {caseData.flags.length > 0 && (
        <Card title="Case Flags" className="mb-5">
          <div className="flex flex-wrap gap-2">
            {caseData.flags.map((f) => (
              <Tag key={f} variant="warning">
                {f.replace(/_/g, ' ')}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3 mt-5 flex-wrap">
        <Link to="/search">
          <Button variant="secondary">Back to search</Button>
        </Link>
        <Link to={`/case/${caseData.accessionNumber}`}>
          <Button variant="ghost">Case detail</Button>
        </Link>
      </div>
    </div>
  );
}
