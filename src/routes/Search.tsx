import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCases } from '../mock/data';
import type { Case, CaseStatus } from '../mock/types';
import { Tag } from '../components/ui/Tag';

const statusVariant: Record<CaseStatus, 'info' | 'warning' | 'neutral' | 'success'> = {
  intake: 'info',
  in_grossing: 'warning',
  submitted: 'neutral',
  finalized: 'success',
};

const statusLabel: Record<CaseStatus, string> = {
  intake: 'Intake',
  in_grossing: 'In grossing',
  submitted: 'Submitted',
  finalized: 'Finalized',
};

export function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? mockCases.filter((c) =>
        c.accessionNumber.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : mockCases;

  function handleClick(c: Case) {
    if (c.status === 'submitted' || c.status === 'finalized') {
      navigate(`/case/${c.accessionNumber}/em-final`);
    } else {
      navigate(`/case/${c.accessionNumber}`);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-arkana-black mb-6">Search Case</h1>
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-arkana-gray-500">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter accession #, e.g. S26-12500"
          className="w-full h-14 rounded-2xl border border-arkana-gray-200 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-arkana-red"
        />
      </div>
      <div className="space-y-3">
        {results.length === 0 ? (
          <div className="text-center py-12 text-arkana-gray-500">No cases match "{query}"</div>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              onClick={() => handleClick(c)}
              className="w-full bg-white border border-arkana-gray-200 rounded-2xl p-5 flex items-center justify-between hover:border-sky-400 hover:shadow-md transition text-left"
            >
              <div>
                <div className="text-lg font-semibold text-arkana-black">
                  {c.accessionNumber}
                </div>
                <div className="text-arkana-gray-500 text-sm mt-1">
                  {c.patient.firstName} {c.patient.lastName} · MRN {c.patient.medicalRecordNumber}
                </div>
              </div>
              <Tag variant={statusVariant[c.status]}>{statusLabel[c.status]}</Tag>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
