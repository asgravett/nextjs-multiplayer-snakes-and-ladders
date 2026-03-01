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
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-300',
    defaultIcon: '⚠️',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-300',
    defaultIcon: '⚡',
  },
  info: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-300',
    defaultIcon: 'ℹ️',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-300',
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
