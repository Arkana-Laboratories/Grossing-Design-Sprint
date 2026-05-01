import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { Button } from '../components/ui/Button';
import { useCaseSession } from '../state/CaseSessionContext';
import { RenalIdfForm } from '../components/RenalIdfForm';
import { NeuroIdfForm } from '../components/NeuroIdfForm';

export function Grossing() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { session, startSession } = useCaseSession();

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  useEffect(() => {
    if (!accessionNumber || !caseData) return;
    if (
      !session ||
      session.accessionNumber !== accessionNumber ||
      session.panelType !== caseData.panelType
    ) {
      startSession(accessionNumber, caseData.panelType);
    }
  }, [accessionNumber, caseData, session, startSession]);

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

  if (!session || session.accessionNumber !== caseData.accessionNumber) {
    return <div className="text-arkana-gray-500">Loading IDF…</div>;
  }

  return (
    <div>
      <Link
        to="/"
        className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline"
      >
        ← Back to home
      </Link>
      <div className="mt-3">
        {session.panelType === 'renal' ? (
          <RenalIdfForm caseData={caseData} idf={session.idf} />
        ) : (
          <NeuroIdfForm caseData={caseData} idf={session.idf} />
        )}
      </div>
    </div>
  );
}
