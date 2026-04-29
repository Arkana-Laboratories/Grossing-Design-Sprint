import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCaseByAccession } from '../mock/data';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Tag';
import { useToast } from '../components/ToastHost';

type Choice = 'yes' | 'no';

function calculateAge(dobIso: string): number {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatDob(dobIso: string): string {
  const d = new Date(dobIso);
  if (Number.isNaN(d.getTime())) return dobIso;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getFullYear()}`;
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
  const idfId = useMemo(
    () => (caseData ? generateIdfId(caseData.accessionNumber) : ''),
    [caseData],
  );

  if (!caseData) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">⚠️</div>
        <h2 className="text-xl font-semibold text-arkana-black mb-2">Case not found</h2>
        <p className="text-arkana-gray-500 mb-6">
          We couldn't find case {accessionNumber}.
        </p>
        <Link to="/gross">
          <Button variant="primary">Back to Gross</Button>
        </Link>
      </div>
    );
  }

  function handleVerify() {
    if (choice === 'yes') {
      toast({
        message: `Verified — intake confirmed (${idfId})`,
        variant: 'success',
      });
      setTimeout(() => {
        toast({ message: 'Sent labels to printer (Bench 3)', variant: 'info' });
      }, 600);
      navigate(`/case/${caseData!.accessionNumber}/gross`);
    } else {
      toast({
        message: `Flagged for review (${idfId}) — accessioning notified`,
        variant: 'warning',
      });
      navigate('/gross');
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link to="/gross" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
        ← Back
      </Link>

      <div className="bg-white border border-arkana-gray-200 rounded-2xl shadow-sm mt-3 p-8">
        <div className="bg-sky-50 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div className="text-3xl font-semibold text-arkana-black">
              {caseData.accessionNumber}
            </div>
            <Tag variant={caseData.panelType === 'renal' ? 'info' : 'success'}>
              {caseData.caseType}
            </Tag>
          </div>
          <div className="text-xl text-arkana-black mb-1">
            {caseData.patient.lastName}, {caseData.patient.firstName}
          </div>
          <div className="text-sm text-arkana-gray-500">
            {formatDob(caseData.patient.dateOfBirth)} · Age{' '}
            {calculateAge(caseData.patient.dateOfBirth)}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <label
            className={`flex items-center justify-between gap-3 cursor-pointer p-4 border rounded-xl transition ${
              choice === 'yes'
                ? 'border-sky-400 bg-sky-50'
                : 'border-arkana-gray-200 hover:bg-arkana-gray-50'
            }`}
          >
            <span className="text-base text-arkana-black">Yes, everything looks ok.</span>
            <input
              type="radio"
              name="verification-choice"
              checked={choice === 'yes'}
              onChange={() => setChoice('yes')}
              className="h-5 w-5"
            />
          </label>
          <label
            className={`flex items-center justify-between gap-3 cursor-pointer p-4 border rounded-xl transition ${
              choice === 'no'
                ? 'border-amber-400 bg-amber-50'
                : 'border-arkana-gray-200 hover:bg-arkana-gray-50'
            }`}
          >
            <span className="text-base text-arkana-black">No, changes needed.</span>
            <input
              type="radio"
              name="verification-choice"
              checked={choice === 'no'}
              onChange={() => setChoice('no')}
              className="h-5 w-5"
            />
          </label>
        </div>

        <Button variant="primary" size="lg" className="w-full" onClick={handleVerify}>
          Verify
        </Button>
      </div>
    </div>
  );
}
