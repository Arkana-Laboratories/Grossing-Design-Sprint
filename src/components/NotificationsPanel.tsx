import { useEffect } from 'react';

export type NotificationVariant = 'info' | 'warning' | 'danger' | 'success';

export interface Notification {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  variant: NotificationVariant;
}

interface Props {
  open: boolean;
  notifications: Notification[];
  onClose: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

const dotClass: Record<NotificationVariant, string> = {
  info: 'bg-arkana-blue',
  warning: 'bg-amber-500',
  danger: 'bg-arkana-red',
  success: 'bg-arkana-green',
};

export function NotificationsPanel({
  open,
  notifications,
  onClose,
  onDismiss,
  onClearAll,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-30 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`fixed top-0 right-0 z-40 w-full sm:w-96 h-full bg-white border-l border-arkana-gray-200 shadow-xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Notifications"
        aria-modal={open}
        aria-hidden={!open}
      >
        <header className="h-16 px-5 flex items-center justify-between border-b border-arkana-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-arkana-black tracking-tight">
              Notifications
            </h2>
            {notifications.length > 0 && (
              <span className="text-xs font-bold text-arkana-gray-500">
                {notifications.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs font-bold text-arkana-red hover:text-arkana-red-dark"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="text-arkana-gray-500 hover:text-arkana-black w-8 h-8 rounded-full hover:bg-arkana-gray-50 flex items-center justify-center text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>
        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-arkana-gray-500">
              <div className="text-3xl mb-2" aria-hidden>
                🔕
              </div>
              <p className="italic">You're all caught up.</p>
            </div>
          ) : (
            <ul className="divide-y divide-arkana-gray-200">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="p-4 flex items-start gap-3 hover:bg-arkana-gray-50 transition"
                >
                  <div
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dotClass[n.variant]}`}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-arkana-black font-medium">
                      {n.title}
                    </div>
                    <div className="text-xs text-arkana-gray-500 mt-0.5 truncate">
                      {n.subtitle}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-arkana-gray-500 font-bold mt-1">
                      {n.timestamp}
                    </div>
                  </div>
                  <button
                    onClick={() => onDismiss(n.id)}
                    className="text-arkana-gray-500 hover:text-arkana-red w-7 h-7 rounded-full hover:bg-arkana-red-light flex items-center justify-center text-base leading-none transition shrink-0"
                    aria-label={`Dismiss ${n.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
