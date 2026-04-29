import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface DemoPreset {
  id: string;
  label: string;
  transcript: string;
}

interface DemoPresetContextValue {
  presets: DemoPreset[];
  activePresetId: string | null;
  setActivePresetId: (id: string) => void;
  registerPresets: (presets: DemoPreset[]) => void;
  clearPresets: () => void;
}

const DemoPresetContext = createContext<DemoPresetContextValue | null>(null);

export function DemoPresetProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [activePresetId, setActivePresetIdState] = useState<string | null>(null);

  const registerPresets = useCallback((next: DemoPreset[]) => {
    setPresets(next);
    setActivePresetIdState((current) => {
      if (current && next.some((p) => p.id === current)) return current;
      return next[0]?.id ?? null;
    });
  }, []);

  const clearPresets = useCallback(() => {
    setPresets([]);
    setActivePresetIdState(null);
  }, []);

  const setActivePresetId = useCallback((id: string) => {
    setActivePresetIdState(id);
  }, []);

  const value = useMemo(
    () => ({ presets, activePresetId, setActivePresetId, registerPresets, clearPresets }),
    [presets, activePresetId, setActivePresetId, registerPresets, clearPresets],
  );

  return <DemoPresetContext.Provider value={value}>{children}</DemoPresetContext.Provider>;
}

export function useDemoPreset() {
  const ctx = useContext(DemoPresetContext);
  if (!ctx) throw new Error('useDemoPreset must be used within DemoPresetProvider');
  return ctx;
}

export function useRegisterDemoPresets(presets: DemoPreset[]) {
  const { registerPresets, clearPresets, activePresetId } = useDemoPreset();
  useEffect(() => {
    registerPresets(presets);
    return () => clearPresets();
  }, [presets, registerPresets, clearPresets]);
  const active = presets.find((p) => p.id === activePresetId) ?? presets[0] ?? null;
  return active;
}
