import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GrossEntryModal } from '../components/GrossEntryModal';

const sw = { strokeWidth: 2, stroke: 'currentColor', fill: 'none' } as const;

function MicroscopeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...sw}>
      <path d="M6 18h12M10 2v6M14 2v6M7 8h10a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1V9a1 1 0 011-1z"/>
      <path d="M12 12v3M9 18a3 3 0 006 0"/>
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...sw}>
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" {...sw}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  );
}

const iconBg: Record<string, string> = {
  gross:  'bg-arkana-red-light text-arkana-red',
  search: 'bg-arkana-blue-light text-arkana-blue',
  logs:   'bg-arkana-green-light text-arkana-green',
};

export function Landing() {
  const [grossOpen, setGrossOpen] = useState(false);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-arkana-black tracking-tight">
          Good morning, J. Doe
        </h1>
        <p className="text-arkana-gray-500 text-sm mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button
          onClick={() => setGrossOpen(true)}
          className="bg-white rounded-xl border border-arkana-gray-200 p-6 flex flex-col gap-4 text-left hover:border-arkana-gray-300 hover:shadow-md transition-all duration-150 group"
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg.gross}`}>
            <MicroscopeIcon />
          </div>
          <div>
            <div className="font-semibold text-arkana-black text-[15px] group-hover:text-arkana-red transition-colors">
              Gross
            </div>
            <div className="text-arkana-gray-500 text-sm mt-0.5">Start a grossing workflow</div>
          </div>
        </button>

        <Link
          to="/search"
          className="bg-white rounded-xl border border-arkana-gray-200 p-6 flex flex-col gap-4 text-left hover:border-arkana-gray-300 hover:shadow-md transition-all duration-150 group"
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg.search}`}>
            <SearchIcon />
          </div>
          <div>
            <div className="font-semibold text-arkana-black text-[15px] group-hover:text-arkana-blue transition-colors">
              Case Search
            </div>
            <div className="text-arkana-gray-500 text-sm mt-0.5">Look up a case by accession #</div>
          </div>
        </Link>

        <Link
          to="/accession-logs"
          className="bg-white rounded-xl border border-arkana-gray-200 p-6 flex flex-col gap-4 text-left hover:border-arkana-gray-300 hover:shadow-md transition-all duration-150 group"
        >
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${iconBg.logs}`}>
            <ClipboardIcon />
          </div>
          <div>
            <div className="font-semibold text-arkana-black text-[15px] group-hover:text-arkana-green transition-colors">
              Accession Logs
            </div>
            <div className="text-arkana-gray-500 text-sm mt-0.5">Recent intake activity</div>
          </div>
        </Link>
      </div>

      {grossOpen && <GrossEntryModal onClose={() => setGrossOpen(false)} />}
    </div>
  );
}
