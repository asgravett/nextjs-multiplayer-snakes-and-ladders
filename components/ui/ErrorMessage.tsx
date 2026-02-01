// filepath: components/ui/ErrorMessage.tsx
'use client';

import { HTMLAttributes } from 'react';

type ErrorVariant = 'error' | 'warning' | 'info' | 'success';

interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  variant?: ErrorVariant;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ReactNode;
}

const variantStyles: Record<
  ErrorVariant,
  { bg: string; border: string; text: string; defaultIcon: string }
> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    defaultIcon: '⚠️',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    defaultIcon: '⚡',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    defaultIcon: 'ℹ️',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    defaultIcon: '✓',
  },
};

export default function ErrorMessage({
  message,
  variant = 'error',
  dismissible = false,
  onDismiss,
  icon,
  className = '',
  ...props
}: ErrorMessageProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`
        ${styles.bg} ${styles.border} ${styles.text}
        border-2 px-4 py-3 rounded-lg
        flex items-center justify-between gap-3
        animate-in fade-in duration-200
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon || styles.defaultIcon}</span>
        <span className="font-semibold">{message}</span>
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="text-current opacity-70 hover:opacity-100 transition-opacity p-1"
          aria-label="Dismiss"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export type { ErrorMessageProps, ErrorVariant };
