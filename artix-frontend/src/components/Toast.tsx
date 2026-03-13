import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  autoRefresh?: boolean;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
  onRefresh?: () => void;
}

export function Toast({ toasts, onRemove, onRefresh }: ToastProps) {
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Auto-remove toasts after their duration
    toasts.forEach(toast => {
      if (toast.duration) {
        const timeout = setTimeout(() => {
          onRemove(toast.id);
          // Auto-refresh if needed
          if (toast.autoRefresh && onRefresh) {
            setRefreshing(true);
            onRefresh();
            setTimeout(() => setRefreshing(false), 1000);
          }
        }, toast.duration);

        return () => clearTimeout(timeout);
      }
    });
  }, [toasts, onRemove, onRefresh]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[9999] space-y-3 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`transform transition-all duration-300 animate-slide-up ${
            toast.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border border-green-400/30'
              : toast.type === 'error'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 border border-red-400/30'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 border border-blue-400/30'
          } rounded-lg p-4 shadow-2xl backdrop-blur-md text-white flex items-start gap-4`}
        >
          {/* Icon */}
          <div className="flex-shrink-0 pt-0.5">
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 animate-pulse" />
            )}
            {toast.type === 'info' && (
              <CheckCircle2 className="w-5 h-5 animate-bounce" />
            )}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold break-words">{toast.message}</p>
            {toast.autoRefresh && refreshing && (
              <p className="text-xs mt-2 opacity-75 flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
                Refreshing...
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => onRemove(toast.id)}
            className="flex-shrink-0 text-white/70 hover:text-white transition-colors pt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
