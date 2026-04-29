import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { PanelType } from '../mock/types';
import {
  type RenalIdfState,
  createEmptyRenalIdf,
} from '../templates/renalIdf';
import {
  type NeuroIdfState,
  createEmptyNeuroIdf,
} from '../templates/neuroIdf';

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

interface ContextValue {
  session: CaseSession | null;
  startSession: (accessionNumber: string, panelType: PanelType) => void;
  updateRenal: (updater: (current: RenalIdfState) => RenalIdfState) => void;
  updateNeuro: (updater: (current: NeuroIdfState) => NeuroIdfState) => void;
  resetIdf: () => void;
  clearSession: () => void;
}

const CaseSessionContext = createContext<ContextValue | null>(null);

export function CaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CaseSession | null>(null);

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

  return (
    <CaseSessionContext.Provider
      value={{ session, startSession, updateRenal, updateNeuro, resetIdf, clearSession }}
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
