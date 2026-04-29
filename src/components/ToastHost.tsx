import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastInput {
  message: string;
  variant?: ToastVariant;
}

const ToastContext = createContext<((input: ToastInput) => void) | null>(null);

const variantClasses: Record<ToastVariant, string> = {
  info: 'bg-sky-50 border-sky-200 text-sky-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  danger: 'bg-rose-50 border-rose-200 text-rose-900',
};

export function ToastHost({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((input: ToastInput) => {
    const id = Date.now() + Math.random();
    const toast: Toast = {
      id,
      message: input.message,
      variant: input.variant ?? 'info',
    };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`border rounded-xl px-4 py-3 shadow-md text-sm font-medium ${variantClasses[t.variant]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastHost');
  }
  return ctx;
}
