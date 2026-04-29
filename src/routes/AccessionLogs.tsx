import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Tag } from '../components/ui/Tag';

interface LogEntry {
  id: string;
  timestamp: string;
  accessionNumber: string;
  patient: string;
  event: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
  user: string;
}

const logEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: '11:42 AM',
    accessionNumber: 'S26-12500',
    patient: 'Jane Doe',
    event: 'Materials scanned & verified',
    variant: 'success',
    user: 'JD',
  },
  {
    id: 'log-2',
    timestamp: '11:42 AM',
    accessionNumber: 'S26-12500',
    patient: 'Jane Doe',
    event: 'Labels printed (Bench 3)',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-3',
    timestamp: '11:18 AM',
    accessionNumber: 'S26-12533',
    patient: 'Maria Lopez',
    event: 'Grossing started',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-4',
    timestamp: '10:55 AM',
    accessionNumber: 'S26-12555',
    patient: 'Priya Shah',
    event: 'Flag raised: bottle leaked',
    variant: 'danger',
    user: 'JD',
  },
  {
    id: 'log-5',
    timestamp: '10:30 AM',
    accessionNumber: 'S26-12555',
    patient: 'Priya Shah',
    event: 'Materials received',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-6',
    timestamp: '09:48 AM',
    accessionNumber: 'S26-12533',
    patient: 'Maria Lopez',
    event: 'Materials received',
    variant: 'info',
    user: 'JD',
  },
  {
    id: 'log-7',
    timestamp: 'Yesterday 4:12 PM',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    event: 'CR requested — age change',
    variant: 'warning',
    user: 'MS',
  },
  {
    id: 'log-8',
    timestamp: 'Yesterday 2:02 PM',
    accessionNumber: 'S26-12476',
    patient: 'Robert Singh',
    event: 'Case finalized',
    variant: 'success',
    user: 'MS',
  },
];

export function AccessionLogs() {
  return (
    <div>
      <div className="mb-6">
        <Link to="/" className="text-sm text-arkana-red hover:text-arkana-red-dark hover:underline">
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-arkana-black mt-1">Accession Logs</h1>
        <p className="text-arkana-gray-500 mt-1">Recent intake activity across the bench.</p>
      </div>

      <Card>
        <ul className="divide-y divide-arkana-gray-200">
          {logEntries.map((entry) => (
            <li key={entry.id} className="py-3 flex items-start gap-4">
              <div className="text-xs text-arkana-gray-500 w-24 shrink-0 mt-0.5">
                {entry.timestamp}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/case/${entry.accessionNumber}`}
                    className="text-sm font-semibold text-arkana-black hover:text-arkana-red"
                  >
                    {entry.accessionNumber}
                  </Link>
                  <span className="text-xs text-arkana-gray-500">·</span>
                  <span className="text-sm text-arkana-gray-500">{entry.patient}</span>
                </div>
                <div className="text-sm text-arkana-black mt-0.5">{entry.event}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Tag variant={entry.variant}>{entry.variant}</Tag>
                <div className="h-7 w-7 rounded-full bg-arkana-gray-200 text-arkana-black flex items-center justify-center text-xs font-semibold">
                  {entry.user}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
