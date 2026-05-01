import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { useCaseSession } from '../state/CaseSessionContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  RenalReadonlyView,
  NeuroReadonlyView,
  SummaryRow,
} from '../components/IdfReadonlyView';
import { Tag } from '../components/ui/Tag';
import { GrossEntryModal } from '../components/GrossEntryModal';

function formatDob(dob: string): string {
  const [year, month, day] = dob.split('-');
  return `${month}/${day}/${year}`;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatReceived(iso: string | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

const sw = { strokeWidth: 2, stroke: 'currentColor', fill: 'none' } as const;

function SubmittedBadge() {
  return (
    <div className="flex items-center justify-center gap-2.5 bg-arkana-green-light border border-emerald-200 rounded-xl px-5 py-3 mb-6">
      <svg width="16" height="16" viewBox="0 0 24 24" {...sw} className="text-arkana-green shrink-0">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      <span className="text-[13px] font-semibold text-arkana-green">IDF submitted successfully</span>
    </div>
  );
}

export function CaseSummary() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const { getSubmittedIdf } = useCaseSession();
  const [grossOpen, setGrossOpen] = useState(false);
  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <p className="text-arkana-gray-500 mb-4">Case not found.</p>
        <Link to="/"><Button>Back to landing</Button></Link>
      </div>
    );
  }

  const snapshot = accessionNumber ? getSubmittedIdf(accessionNumber) : undefined;
  const grossedAt = snapshot?.submittedAt
    ? new Date(snapshot.submittedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto">

      <SubmittedBadge />

      {/* Case header */}
      <div className="bg-white border border-arkana-gray-200 rounded-xl shadow-sm overflow-hidden mb-5">
        <div className="bg-arkana-gray-50 border-b border-arkana-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="text-[22px] font-bold text-arkana-black tracking-tight leading-none">
                {caseData.accessionNumber}
              </div>
              <Tag variant="info">{caseData.caseType}</Tag>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.08em] bg-arkana-green-light text-arkana-green px-3 py-1.5 rounded-full border border-emerald-200">
              Submitted
            </span>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="text-[15px] font-semibold text-arkana-black mb-4">
            {caseData.patient.lastName}, {caseData.patient.firstName}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <SummaryRow label="Date of Birth">
              {formatDob(caseData.patient.dateOfBirth)}
            </SummaryRow>
            <SummaryRow label="Age">
              {calculateAge(caseData.patient.dateOfBirth)} y/o
            </SummaryRow>
            <SummaryRow label="Received">
              {formatReceived(caseData.receivedAt)}
            </SummaryRow>
            {caseData.submittingState && (
              <SummaryRow label="State">{caseData.submittingState}</SummaryRow>
            )}
          </div>
          {grossedAt && (
            <div className="mt-4 pt-4 border-t border-arkana-gray-100 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <SummaryRow label="Grossed by">J. Doe</SummaryRow>
              <SummaryRow label="Grossed at">{grossedAt}</SummaryRow>
            </div>
          )}
        </div>
      </div>

      {!snapshot && (
        <Card className="mb-5">
          <p className="text-sm text-arkana-gray-500">
            No submitted IDF for this case — complete the grossing flow first.
          </p>
        </Card>
      )}

      {snapshot && snapshot.panelType === 'renal' && (
        <RenalReadonlyView idf={snapshot.idf} caseData={caseData} />
      )}
      {snapshot && snapshot.panelType === 'neuro' && (
        <NeuroReadonlyView idf={snapshot.idf} caseData={caseData} />
      )}

      <div className="flex gap-3 justify-center mt-5 flex-wrap">
        <Link to="/"><Button variant="primary">Back to home</Button></Link>
        <Button variant="secondary" onClick={() => setGrossOpen(true)}>Gross another case</Button>
        <Link to={`/case/${caseData.accessionNumber}`}><Button variant="ghost">View case</Button></Link>
      </div>

      {grossOpen && <GrossEntryModal onClose={() => setGrossOpen(false)} />}
    </div>
  );
}
