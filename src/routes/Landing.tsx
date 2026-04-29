import { Link } from 'react-router-dom';

interface Tile {
  label: string;
  to: string;
  icon: string;
  description: string;
}

const tiles: Tile[] = [
  {
    label: 'Case Search',
    to: '/search',
    icon: '🔍',
    description: 'Look up a case by accession #',
  },
  {
    label: 'Gross',
    to: '/gross',
    icon: '🔬',
    description: 'Start a grossing workflow',
  },
  {
    label: 'Accession Logs',
    to: '/accession-logs',
    icon: '📜',
    description: 'Recent intake activity',
  },
];

export function Landing() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-arkana-black">Welcome, John Doe</h1>
      <p className="text-arkana-gray-500 mt-1 mb-8">{today}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="bg-white rounded-2xl border border-arkana-gray-200 p-8 flex flex-col items-center justify-center text-center min-h-[220px] hover:border-sky-400 hover:shadow-md active:scale-[0.98] transition"
          >
            <div className="text-6xl mb-4">{tile.icon}</div>
            <div className="text-lg text-arkana-black font-semibold">{tile.label}</div>
            <div className="text-sm text-arkana-gray-500 mt-1">{tile.description}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
