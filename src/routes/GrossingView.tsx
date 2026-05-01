import { Link, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { Card } from '../components/ui/Card';
import { useCaseSession } from '../state/CaseSessionContext';
import {
  RenalReadonlyView,
  NeuroReadonlyView,
} from '../components/IdfReadonlyView';
import { RENAL_IDF_TEMPLATE } from '../templates/renalIdf';
import { NEURO_IDF_TEMPLATE } from '../templates/neuroIdf';

export function GrossingView() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { getSubmittedIdf } = useCaseSession();

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;
  const snapshot = accessionNumber ? getSubmittedIdf(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-arkana-gray-500 mb-4">Case not found.</p>
        <Link to="/search">
          <Button>Back to search</Button>
        </Link>
      </div>
    );
  }

  const templateName =
    caseData.panelType === 'renal'
      ? RENAL_IDF_TEMPLATE.name
      : NEURO_IDF_TEMPLATE.name;

  const submittedAtLabel = snapshot
    ? new Date(snapshot.submittedAt).toLocaleString()
    : null;

  return (
    <div>
      <Link
        to={`/case/${caseData.accessionNumber}`}
        className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline"
      >
        ← Back to case
      </Link>

      <div className="mt-3 flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Tag variant="neutral">Read-only</Tag>
            <Tag variant={caseData.panelType === 'renal' ? 'info' : 'success'}>
              {caseData.caseType}
            </Tag>
            {submittedAtLabel && (
              <span className="text-xs text-arkana-gray-500">
                Submitted {submittedAtLabel}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-arkana-black">
            {caseData.accessionNumber}
          </h1>
          <p className="text-arkana-gray-500 text-sm mt-0.5">
            {caseData.patient.lastName}, {caseData.patient.firstName} · {templateName}
          </p>
        </div>
      </div>

      {!snapshot && (
        <Card className="mb-5">
          <p className="text-sm text-arkana-gray-500">
            This case hasn't been submitted yet. The read-only view shows the
            grossing IDF as it was at submit time — once a grosser submits this
            case, the snapshot will appear here.
          </p>
          <div className="mt-3">
            <Link to={`/case/${caseData.accessionNumber}/gross`}>
              <Button variant="secondary">Open grossing form</Button>
            </Link>
          </div>
        </Card>
      )}

      {snapshot && snapshot.panelType === 'renal' && (
        <RenalReadonlyView idf={snapshot.idf} caseData={caseData} />
      )}
      {snapshot && snapshot.panelType === 'neuro' && (
        <NeuroReadonlyView idf={snapshot.idf} caseData={caseData} />
      )}

      {snapshot && caseData.flags.length > 0 && (
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
    </div>
  );
}
