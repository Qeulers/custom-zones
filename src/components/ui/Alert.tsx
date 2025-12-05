import { ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
};

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export function Alert({ type, title, children, onClose, className = '' }: AlertProps) {
  const styles = alertStyles[type];
  const Icon = icons[type];

  return (
    <div
      className={`
        rounded-lg border p-4
        ${styles.container}
        ${className}
      `}
    >
      <div className="flex">
        <Icon className={`h-5 w-5 flex-shrink-0 ${styles.icon}`} />
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>{title}</h3>
          )}
          <div className={`text-sm ${title ? 'mt-1' : ''} ${styles.text}`}>
            {children}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-3 flex-shrink-0 ${styles.icon} hover:opacity-70`}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}
