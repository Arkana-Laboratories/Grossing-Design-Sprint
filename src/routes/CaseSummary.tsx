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
import { RENAL_IDF_TEMPLATE } from '../templates/renalIdf';
import { NEURO_IDF_TEMPLATE } from '../templates/neuroIdf';

export function CaseSummary() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { session } = useCaseSession();
  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-arkana-gray-500 mb-4">Case not found.</p>
        <Link to="/">
          <Button>Back to landing</Button>
        </Link>
      </div>
    );
  }

  const sessionMatchesCase =
    session &&
    session.accessionNumber === caseData.accessionNumber &&
    session.panelType === caseData.panelType;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-2xl font-semibold text-arkana-black">
          Case {caseData.accessionNumber} submitted
        </h1>
        <p className="text-arkana-gray-500 mt-1">
          {caseData.panelType === 'renal'
            ? RENAL_IDF_TEMPLATE.name
            : NEURO_IDF_TEMPLATE.name}{' '}
          · sent to TX queue
        </p>
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <SummaryRow label="Patient">
            {caseData.patient.firstName} {caseData.patient.lastName}
          </SummaryRow>
          <SummaryRow label="MRN">{caseData.patient.medicalRecordNumber}</SummaryRow>
          <SummaryRow label="Panel">
            <Tag variant="info">{caseData.panelType.toUpperCase()}</Tag>
          </SummaryRow>
          <SummaryRow label="Status">{caseData.status}</SummaryRow>
        </div>
      </Card>

      {!sessionMatchesCase && (
        <Card className="mb-5">
          <p className="text-sm text-arkana-gray-500">
            No live IDF session for this case. (Submit the IDF first to see fields here.)
          </p>
        </Card>
      )}

      {sessionMatchesCase && session.panelType === 'renal' && (
        <RenalReadonlyView idf={session.idf} caseData={caseData} />
      )}
      {sessionMatchesCase && session.panelType === 'neuro' && (
        <NeuroReadonlyView idf={session.idf} caseData={caseData} />
      )}

      <div className="flex gap-3 justify-center mt-5 flex-wrap">
        <Link to="/">
          <Button variant="primary">Back to landing</Button>
        </Link>
        <Link to={`/case/${caseData.accessionNumber}`}>
          <Button variant="secondary">View case</Button>
        </Link>
        <Link to={`/case/${caseData.accessionNumber}/em-final`}>
          <Button variant="ghost">View EM Final</Button>
        </Link>
      </div>
    </div>
  );
}
