import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-600 dark:text-green-400',
    accent: 'text-green-600 dark:text-green-400'
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    accent: 'text-red-600 dark:text-red-400'
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-400',
    accent: 'text-yellow-600 dark:text-yellow-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    accent: 'text-purple-600 dark:text-purple-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-600 dark:text-indigo-400',
    accent: 'text-indigo-600 dark:text-indigo-400'
  }
};

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  size = 'md',
  onClick,
  className = ''
}) => {
  const { isDarkMode } = useTheme();
  const colors = colorClasses[color];
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800
        ${colors.border} ${sizeClass}
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        transition-all duration-200 hover:shadow-lg
        ${className}
      `}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 opacity-5 ${colors.bg}`} />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    trend.isPositive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
          </div>
          {icon && (
            <div className={`p-2 rounded-lg ${colors.bg}`}>
              <div className={colors.icon}>{icon}</div>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        )}

        {/* Trend Period */}
        {trend && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            vs {trend.period}
          </p>
        )}
      </div>
    </div>
  );
};

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'blue' | 'green' | 'purple' | 'indigo';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  icon,
  onClick,
  color = 'blue',
  size = 'md',
  disabled = false,
  className = ''
}) => {
  const colors = colorClasses[color];
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center space-x-2 rounded-lg font-medium
        transition-all duration-200 border
        ${colors.bg} ${colors.border} ${colors.accent}
        hover:shadow-md hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = 'default',
  size = 'sm',
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    
    if (['paid', 'completed', 'approved', 'active', 'success'].includes(lowerStatus)) {
      return 'green';
    } else if (['pending', 'draft', 'processing', 'review'].includes(lowerStatus)) {
      return 'yellow';
    } else if (['overdue', 'failed', 'rejected', 'cancelled', 'expired'].includes(lowerStatus)) {
      return 'red';
    } else if (['sent', 'in_progress', 'scheduled'].includes(lowerStatus)) {
      return 'blue';
    } else {
      return 'gray';
    }
  };

  const color = getStatusColor(status);
  const baseClasses = {
    green: {
      default: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      outline: 'border-green-300 text-green-700 dark:border-green-600 dark:text-green-400',
      solid: 'bg-green-600 text-white'
    },
    yellow: {
      default: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      outline: 'border-yellow-300 text-yellow-700 dark:border-yellow-600 dark:text-yellow-400',
      solid: 'bg-yellow-600 text-white'
    },
    red: {
      default: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      outline: 'border-red-300 text-red-700 dark:border-red-600 dark:text-red-400',
      solid: 'bg-red-600 text-white'
    },
    blue: {
      default: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      outline: 'border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-400',
      solid: 'bg-blue-600 text-white'
    },
    gray: {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      outline: 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-400',
      solid: 'bg-gray-600 text-white'
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${variant === 'outline' ? 'border bg-transparent' : ''}
        ${baseClasses[color][variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {status}
    </span>
  );
};
