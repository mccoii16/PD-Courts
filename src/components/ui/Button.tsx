import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-sm px-3.5 py-2 min-h-[40px] gap-2',
    md: 'text-base px-5 py-3 min-h-[48px] gap-2.5',
    lg: 'text-lg px-6 py-3.5 min-h-[54px] gap-3',
    xl: 'text-xl px-8 py-4 min-h-[60px] gap-3.5',
  };

  const variantStyles = {
    primary:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm border border-emerald-500/30',
    secondary:
      'bg-neutral-800 text-white hover:bg-neutral-900 active:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 border border-transparent shadow-sm',
    outline:
      'bg-transparent text-neutral-800 dark:text-neutral-200 border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 active:bg-neutral-300/50',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-600 dark:hover:bg-rose-500 border border-rose-500/30',
    ghost:
      'bg-transparent text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 active:bg-neutral-300/60 border border-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};
