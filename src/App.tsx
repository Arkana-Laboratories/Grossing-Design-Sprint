import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ToastHost } from './components/ToastHost';
import { CaseSessionProvider } from './state/CaseSessionContext';
import { DemoPresetProvider } from './state/DemoPresetContext';
import { Login } from './routes/Login';
import { Landing } from './routes/Landing';
import { Search } from './routes/Search';
import { Gross } from './routes/Gross';
import { AccessionLogs } from './routes/AccessionLogs';
import { CaseDetail } from './routes/CaseDetail';
import { Verify } from './routes/Verify';
import { Grossing } from './routes/Grossing';
import { CaseSummary } from './routes/CaseSummary';

function RequireAuth() {
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem('cortex.session');
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <ToastHost>
        <CaseSessionProvider>
          <DemoPresetProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Landing />} />
                <Route path="/search" element={<Search />} />
                <Route path="/gross" element={<Gross />} />
                <Route path="/accession-logs" element={<AccessionLogs />} />
                <Route path="/case/:accessionNumber" element={<CaseDetail />} />
                <Route path="/case/:accessionNumber/verify" element={<Verify />} />
                <Route path="/case/:accessionNumber/gross" element={<Grossing />} />
                <Route path="/case/:accessionNumber/summary" element={<CaseSummary />} />
                <Route path="*" element={<PlaceholderRoute />} />
              </Route>
            </Route>
          </Routes>
          </DemoPresetProvider>
        </CaseSessionProvider>
      </ToastHost>
    </BrowserRouter>
  );
}

function PlaceholderRoute() {
  return (
    <div className="text-center py-16">
      <p className="text-slate-600">This area isn't built yet — coming soon.</p>
    </div>
  );
}

export default App;
