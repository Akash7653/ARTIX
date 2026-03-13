import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export interface PopupMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  autoClose?: boolean;
  onConfirm?: () => void;
}

interface PopupProps {
  popups: PopupMessage[];
  onRemove: (id: string) => void;
}

export function Popup({ popups, onRemove }: PopupProps) {
  const handleClose = (id: string) => {
    onRemove(id);
  };

  return (
    <>
      {popups.map((popup) => (
        <PopupNotification
          key={popup.id}
          popup={popup}
          onClose={() => handleClose(popup.id)}
        />
      ))}
    </>
  );
}

interface PopupNotificationProps {
  popup: PopupMessage;
  onClose: () => void;
}

function PopupNotification({ popup, onClose }: PopupNotificationProps) {
  useEffect(() => {
    if (popup.autoClose && popup.duration) {
      const timer = setTimeout(onClose, popup.duration);
      return () => clearTimeout(timer);
    }
  }, [popup, onClose]);

  const getStyles = () => {
    switch (popup.type) {
      case 'success':
        return {
          bgColor: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
          borderColor: 'border-green-500/50',
          titleColor: 'text-green-600 dark:text-green-400',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />,
          buttonColor: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
        };
      case 'error':
        return {
          bgColor: 'bg-gradient-to-br from-red-500/20 to-rose-500/20',
          borderColor: 'border-red-500/50',
          titleColor: 'text-red-600 dark:text-red-400',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />,
          buttonColor: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
        };
      case 'warning':
        return {
          bgColor: 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20',
          borderColor: 'border-yellow-500/50',
          titleColor: 'text-yellow-600 dark:text-yellow-400',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-800'
        };
      default:
        return {
          bgColor: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
          borderColor: 'border-blue-500/50',
          titleColor: 'text-blue-600 dark:text-blue-400',
          textColor: 'text-gray-700 dark:text-gray-300',
          icon: <Info className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
          buttonColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
        };
    }
  };

  const styles = getStyles();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-scale-in pointer-events-none">
        <div className={`${styles.bgColor} border-2 ${styles.borderColor} rounded-2xl p-8 max-w-md w-full shadow-2xl pointer-events-auto transform transition-all`}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className={`${styles.titleColor} text-2xl font-bold text-center mb-3`}>
            {popup.title}
          </h3>

          {/* Message */}
          <p className={`${styles.textColor} text-center mb-6 leading-relaxed`}>
            {popup.message}
          </p>

          {/* Button */}
          <button
            onClick={() => {
              if (popup.onConfirm) popup.onConfirm();
              onClose();
            }}
            className={`${styles.buttonColor} text-white font-bold w-full py-3 rounded-lg transition`}
          >
            Got it!
          </button>
        </div>
      </div>
    </>
  );
}
