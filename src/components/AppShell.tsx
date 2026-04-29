import { Outlet, Link } from 'react-router-dom';
import { ArkanaLogo } from './brand/ArkanaLogo';
import { useDemoPreset } from '../state/DemoPresetContext';

export function AppShell() {
  const year = new Date().getFullYear();
  const { presets, activePresetId, setActivePresetId } = useDemoPreset();
  return (
    <div className="min-h-full flex flex-col bg-arkana-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-arkana-gray-200 h-16 flex items-center px-6 justify-between">
        <Link to="/" className="flex items-center gap-3 text-arkana-black">
          <ArkanaLogo variant="mark" className="h-7" />
          <span className="text-arkana-gray-200" aria-hidden>
            |
          </span>
          <span className="text-base font-medium tracking-tight">
            Cortex Grossing
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {presets.length > 0 && (
            <label className="hidden md:flex items-center gap-2 text-xs">
              <span className="font-bold uppercase tracking-wide text-arkana-gray-500">
                Demo
              </span>
              <select
                value={activePresetId ?? ''}
                onChange={(e) => setActivePresetId(e.target.value)}
                className="h-9 max-w-[18rem] rounded-lg border border-arkana-gray-200 bg-white px-2 text-xs text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
              >
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            aria-label="Notifications"
            className="relative h-10 w-10 rounded-full hover:bg-arkana-gray-50 flex items-center justify-center text-arkana-gray-500 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-arkana-red" />
          </button>
          <div
            className="h-10 w-10 rounded-full bg-arkana-black text-white flex items-center justify-center text-sm font-bold"
            title="John Doe"
          >
            JD
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-arkana-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-arkana-gray-500">
          <div className="flex items-center gap-2">
            <ArkanaLogo variant="mark" className="h-4" />
            <span>© {year} Arkana Laboratories</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Cortex Grossing — internal demo</span>
            <span className="text-arkana-gray-500" aria-hidden>
              ·
            </span>
            <span>HIPAA-aware build</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
