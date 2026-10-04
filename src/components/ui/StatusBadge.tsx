import React from 'react';

export type StatusType = 'live' | 'waiting' | 'completed' | 'paused' | 'available' | 'resting';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const configs: Record<StatusType, { text: string; bg: string; dot: string }> = {
    live: {
      text: label || 'LIVE',
      bg: 'bg-emerald-600 text-white font-extrabold',
      dot: 'bg-white animate-pulse',
    },
    waiting: {
      text: label || 'WAITING',
      bg: 'bg-amber-600 text-white font-bold',
      dot: 'bg-white',
    },
    paused: {
      text: label || 'PAUSED',
      bg: 'bg-amber-700 text-white font-bold',
      dot: 'bg-white',
    },
    completed: {
      text: label || 'FINISHED',
      bg: 'bg-neutral-700 text-white font-bold dark:bg-neutral-800',
      dot: 'bg-neutral-300',
    },
    available: {
      text: label || 'OPEN COURT',
      bg: 'bg-sky-600 text-white font-bold',
      dot: 'bg-white',
    },
    resting: {
      text: label || 'RESTING',
      bg: 'bg-neutral-600 text-white font-bold',
      dot: 'bg-neutral-300',
    },
  };

  const current = configs[status] || configs.waiting;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 tracking-wider',
    md: 'text-sm px-3.5 py-1.5 tracking-wider',
    lg: 'text-base px-4 py-2 tracking-widest',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg uppercase ${sizeClasses[size]} ${current.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span>{current.text}</span>
    </span>
  );
};
