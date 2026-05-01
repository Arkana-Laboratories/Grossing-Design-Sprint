import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PanelType } from '../mock/types';
import {
  type RenalIdfState,
  createEmptyRenalIdf,
} from '../templates/renalIdf';
import {
  type NeuroIdfState,
  createEmptyNeuroIdf,
} from '../templates/neuroIdf';
import { SEED_IDFS } from '../mock/seedIdfs';

export type IdfState = RenalIdfState | NeuroIdfState;

export type CaseSession =
  | {
      accessionNumber: string;
      panelType: 'renal';
      idf: RenalIdfState;
    }
  | {
      accessionNumber: string;
      panelType: 'neuro';
      idf: NeuroIdfState;
    };

export type SubmittedIdf =
  | {
      accessionNumber: string;
      panelType: 'renal';
      idf: RenalIdfState;
      submittedAt: string;
    }
  | {
      accessionNumber: string;
      panelType: 'neuro';
      idf: NeuroIdfState;
      submittedAt: string;
    };

interface ContextValue {
  session: CaseSession | null;
  startSession: (accessionNumber: string, panelType: PanelType) => void;
  updateRenal: (updater: (current: RenalIdfState) => RenalIdfState) => void;
  updateNeuro: (updater: (current: NeuroIdfState) => NeuroIdfState) => void;
  resetIdf: () => void;
  clearSession: () => void;
  submitIdf: () => void;
  getSubmittedIdf: (accessionNumber: string) => SubmittedIdf | undefined;
}

const CaseSessionContext = createContext<ContextValue | null>(null);

const SUBMITTED_KEY = 'cortex.submittedIdfs';

function loadSubmitted(): Record<string, SubmittedIdf> {
  if (typeof window === 'undefined') return { ...SEED_IDFS };
  try {
    const raw = window.localStorage.getItem(SUBMITTED_KEY);
    const stored = raw ? (JSON.parse(raw) as Record<string, SubmittedIdf>) : {};
    const base = stored && typeof stored === 'object' ? stored : {};
    // Seed data fills in any accession not already in localStorage
    return { ...SEED_IDFS, ...base };
  } catch {
    return { ...SEED_IDFS };
  }
}

function cloneIdf<T>(idf: T): T {
  return JSON.parse(JSON.stringify(idf)) as T;
}

export function CaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CaseSession | null>(null);
  const [submittedIdfs, setSubmittedIdfs] = useState<Record<string, SubmittedIdf>>(() => loadSubmitted());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SUBMITTED_KEY, JSON.stringify(submittedIdfs));
    } catch {
      // ignore storage errors (quota, private mode, etc.)
    }
  }, [submittedIdfs]);

  const startSession = useCallback((accessionNumber: string, panelType: PanelType) => {
    if (panelType === 'renal') {
      setSession({ accessionNumber, panelType: 'renal', idf: createEmptyRenalIdf() });
    } else {
      setSession({ accessionNumber, panelType: 'neuro', idf: createEmptyNeuroIdf() });
    }
  }, []);

  const updateRenal = useCallback(
    (updater: (current: RenalIdfState) => RenalIdfState) => {
      setSession((prev) => {
        if (!prev || prev.panelType !== 'renal') return prev;
        return { ...prev, idf: updater(prev.idf) };
      });
    },
    [],
  );

  const updateNeuro = useCallback(
    (updater: (current: NeuroIdfState) => NeuroIdfState) => {
      setSession((prev) => {
        if (!prev || prev.panelType !== 'neuro') return prev;
        return { ...prev, idf: updater(prev.idf) };
      });
    },
    [],
  );

  const resetIdf = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.panelType === 'renal') {
        return { ...prev, idf: createEmptyRenalIdf() };
      }
      return { ...prev, idf: createEmptyNeuroIdf() };
    });
  }, []);

  const clearSession = useCallback(() => setSession(null), []);

  const submitIdf = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      const submittedAt = new Date().toISOString();
      const snapshot: SubmittedIdf =
        prev.panelType === 'renal'
          ? {
              accessionNumber: prev.accessionNumber,
              panelType: 'renal',
              idf: cloneIdf(prev.idf),
              submittedAt,
            }
          : {
              accessionNumber: prev.accessionNumber,
              panelType: 'neuro',
              idf: cloneIdf(prev.idf),
              submittedAt,
            };
      setSubmittedIdfs((map) => ({ ...map, [prev.accessionNumber]: snapshot }));
      return prev;
    });
  }, []);

  const getSubmittedIdf = useCallback(
    (accessionNumber: string) => submittedIdfs[accessionNumber],
    [submittedIdfs],
  );

  return (
    <CaseSessionContext.Provider
      value={{
        session,
        startSession,
        updateRenal,
        updateNeuro,
        resetIdf,
        clearSession,
        submitIdf,
        getSubmittedIdf,
      }}
    >
      {children}
    </CaseSessionContext.Provider>
  );
}

export function useCaseSession() {
  const ctx = useContext(CaseSessionContext);
  if (!ctx) throw new Error('useCaseSession must be used within CaseSessionProvider');
  return ctx;
}
