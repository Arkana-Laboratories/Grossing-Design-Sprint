import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockCases } from '../mock/data';
import type { Case, CaseStatus } from '../mock/types';
import { Tag } from '../components/ui/Tag';

function formatReceived(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
      <div className="space-y-2">
        {results.length === 0 ? (
          <div className="text-center py-12 text-arkana-gray-500">No cases match "{query}"</div>
        ) : (
          results.map((c) => (
            <button
              key={c.id}
              onClick={() => handleClick(c)}
              className="w-full bg-white border border-arkana-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-arkana-gray-300 hover:shadow-sm transition-all duration-150 text-left"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[15px] font-semibold text-arkana-black font-mono tracking-tight">
                    {c.accessionNumber}
                  </span>
                  <span className="text-[11px] font-medium text-arkana-gray-500">
                    {c.caseType}
                  </span>
                </div>
                <div className="text-[13px] text-arkana-gray-500 mt-1">
                  {c.patient.lastName}, {c.patient.firstName}
                  {c.physician && (
                    <span className="text-arkana-gray-400"> · {c.physician}</span>
                  )}
                </div>
                <div className="text-[11px] text-arkana-gray-400 mt-0.5">
                  Received {formatReceived(c.receivedAt)}
                  {c.submittingState && ` · ${c.submittingState}`}
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
