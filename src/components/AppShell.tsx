import { Outlet, Link } from 'react-router-dom';
import { ArkanaLogo } from './brand/ArkanaLogo';
import { useDemoPreset } from '../state/DemoPresetContext';

export function AppShell() {
  const year = new Date().getFullYear();
  const { presets, activePresetId, setActivePresetId } = useDemoPreset();
  return (
    <div className="min-h-full flex flex-col bg-arkana-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-arkana-gray-200 h-14 sm:h-16 flex items-center px-3 sm:px-4 md:px-6 xl:px-8 justify-between gap-2 sm:gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 lg:gap-3 text-arkana-black min-w-0"
        >
          <ArkanaLogo variant="mark" className="h-6 lg:h-7 shrink-0" />
          <span className="text-arkana-gray-200 hidden lg:inline" aria-hidden>
            |
          </span>
          <span className="hidden sm:inline text-sm lg:text-base font-medium tracking-tight truncate">
            Cortex Grossing
          </span>
        </Link>
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {presets.length > 0 && (
            <label className="flex items-center gap-2 text-xs">
              <span className="hidden lg:inline font-bold uppercase tracking-wide text-arkana-gray-500">
                Demo
              </span>
              <select
                value={activePresetId ?? ''}
                onChange={(e) => setActivePresetId(e.target.value)}
                className="h-9 w-32 sm:w-40 md:w-44 lg:w-56 xl:w-72 rounded-lg border border-arkana-gray-200 bg-white px-2 text-xs text-arkana-black focus:outline-none focus:ring-2 focus:ring-arkana-red"
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
            className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full hover:bg-arkana-gray-50 flex items-center justify-center text-arkana-gray-500 transition shrink-0"
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
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-arkana-black text-white flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
            title="John Doe"
          >
            JD
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-arkana-gray-200 bg-white">
        <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 md:px-6 xl:px-8 py-3 sm:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-arkana-gray-500">
          <div className="flex items-center gap-2">
            <ArkanaLogo variant="mark" className="h-4" />
            <span>© {year} Arkana Laboratories</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
