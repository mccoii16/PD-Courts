import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  highlight?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  highlight = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-neutral-900 transition-all ${
        highlight
          ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
          : 'border-neutral-200 dark:border-neutral-800 shadow-sm'
      } p-5 md:p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
