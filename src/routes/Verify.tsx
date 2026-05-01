import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useToast } from '../components/ToastHost';

type Choice = 'yes' | 'no';

const sw = { strokeWidth: 2, stroke: 'currentColor', fill: 'none' } as const;

function WarnIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" {...sw} className="text-arkana-gray-300">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...sw} className="text-arkana-green">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" {...sw} className="text-amber-500">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function calculateAge(dobIso: string): number {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}

function formatDob(dobIso: string): string {
  const d = new Date(dobIso);
  if (Number.isNaN(d.getTime())) return dobIso;
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}

function generateIdfId(accession: string): string {
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `IDF-${accession}-${suffix}`;
}

export function Verify() {
  const { accessionNumber } = useParams<{ accessionNumber: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [choice, setChoice] = useState<Choice>('yes');

  const caseData = accessionNumber ? getCaseByAccession(accessionNumber) : undefined;
  const idfId = useMemo(() => (caseData ? generateIdfId(caseData.accessionNumber) : ''), [caseData]);

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <div className="flex justify-center mb-4">
          <WarnIcon />
        </div>
        <h2 className="text-xl font-semibold text-arkana-black mb-2">Case not found</h2>
        <p className="text-arkana-gray-500 mb-6">We couldn't find case {accessionNumber}.</p>
        <Link to="/gross"><Button variant="primary">Back to Gross</Button></Link>
      </div>
    );
  }

  function handleVerify() {
    if (choice === 'yes') {
      toast({ message: `Verified — intake confirmed (${idfId})`, variant: 'success' });
      setTimeout(() => toast({ message: 'Sent labels to printer (Bench 3)', variant: 'info' }), 600);
      navigate(`/case/${caseData!.accessionNumber}/gross`);
    } else {
      toast({ message: `Flagged for review (${idfId}) — accessioning notified`, variant: 'warning' });
      navigate('/');
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
        ← Home
      </Link>

      <div className="bg-white border border-arkana-gray-200 rounded-xl shadow-sm mt-4 overflow-hidden">

        {/* Patient identity strip */}
        <div className="bg-arkana-gray-50 border-b border-arkana-gray-100 px-6 py-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-arkana-gray-500">
              Confirm patient identity
            </span>
            <Tag variant={caseData.panelType === 'renal' ? 'info' : 'success'}>
              {caseData.caseType}
            </Tag>
          </div>
          <div className="text-[26px] font-bold text-arkana-black tracking-tight leading-none mb-2">
            {caseData.accessionNumber}
          </div>
          <div className="text-[16px] font-semibold text-arkana-black">
            {caseData.patient.lastName}, {caseData.patient.firstName}
          </div>
          <div className="text-[13px] text-arkana-gray-500 mt-1 flex gap-4 flex-wrap">
            <span>DOB: {formatDob(caseData.patient.dateOfBirth)}</span>
            <span>Age {calculateAge(caseData.patient.dateOfBirth)}</span>
          </div>
        </div>

        {/* Confirmation options */}
        <div className="px-6 py-5 space-y-2.5">
          <label
            className={`flex items-center justify-between gap-3 cursor-pointer px-4 py-3.5 border rounded-xl transition ${
              choice === 'yes'
                ? 'border-arkana-green bg-arkana-green-light'
                : 'border-arkana-gray-200 hover:bg-arkana-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                choice === 'yes' ? 'bg-white' : 'bg-arkana-gray-50'
              }`}>
                <CheckIcon />
              </div>
              <span className="text-[14px] font-medium text-arkana-black">Yes, everything looks correct.</span>
            </div>
            <input
              type="radio"
              name="verification-choice"
              checked={choice === 'yes'}
              onChange={() => setChoice('yes')}
              className="h-4 w-4 accent-arkana-red"
            />
          </label>

          <label
            className={`flex items-center justify-between gap-3 cursor-pointer px-4 py-3.5 border rounded-xl transition ${
              choice === 'no'
                ? 'border-amber-400 bg-amber-50'
                : 'border-arkana-gray-200 hover:bg-arkana-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                choice === 'no' ? 'bg-white' : 'bg-arkana-gray-50'
              }`}>
                <FlagIcon />
              </div>
              <span className="text-[14px] font-medium text-arkana-black">No, changes are needed.</span>
            </div>
            <input
              type="radio"
              name="verification-choice"
              checked={choice === 'no'}
              onChange={() => setChoice('no')}
              className="h-4 w-4 accent-arkana-red"
            />
          </label>
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          <Button variant="primary" size="lg" className="w-full" onClick={handleVerify}>
            Confirm &amp; Continue
          </Button>
        </div>

      </div>
    </div>
  );
}
