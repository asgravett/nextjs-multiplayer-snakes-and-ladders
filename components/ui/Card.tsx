'use client';

import { HTMLAttributes, forwardRef } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-white/4 backdrop-blur-xl border border-white/8 shadow-xl shadow-black/20',
  elevated:
    'bg-white/6 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/30',
  outlined: 'bg-transparent border border-white/10',
  gradient:
    'bg-linear-to-br from-white/6 to-white/2 backdrop-blur-xl border border-white/8 shadow-xl shadow-black/20',
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-2xl
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverable ? 'transition-all duration-300 hover:bg-white/8 hover:border-white/15 hover:shadow-2xl cursor-pointer' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

// Card Header sub-component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className = '',
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between mb-5 ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-cyan-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-lg">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Content sub-component
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

function CardContent({ className = '', children, ...props }: CardContentProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

// Card Footer sub-component
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

function CardFooter({ className = '', children, ...props }: CardFooterProps) {
  return (
    <div
      className={`mt-5 pt-5 border-t border-white/8 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
export { CardHeader, CardContent, CardFooter };
export type { CardProps, CardVariant, CardHeaderProps };
