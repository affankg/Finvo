import React from 'react';

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
  const sizeClasses = {
    sm: 'px-4 py-3 text-sm',
    md: 'px-6 py-4 text-base',
    lg: 'px-8 py-5 text-lg'
  };

  // Enhanced color schemes for better visual impact
  const enhancedColorClasses = {
    blue: {
      gradient: 'from-blue-500/20 via-blue-600/15 to-blue-700/20',
      border: 'border-blue-200/60 dark:border-blue-700/50',
      hover: 'hover:from-blue-500/30 hover:via-blue-600/25 hover:to-blue-700/30',
      glow: 'hover:shadow-blue-500/25',
      text: 'text-blue-700 dark:text-blue-300',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      gradient: 'from-green-500/20 via-green-600/15 to-green-700/20',
      border: 'border-green-200/60 dark:border-green-700/50',
      hover: 'hover:from-green-500/30 hover:via-green-600/25 hover:to-green-700/30',
      glow: 'hover:shadow-green-500/25',
      text: 'text-green-700 dark:text-green-300',
      icon: 'text-green-600 dark:text-green-400'
    },
    purple: {
      gradient: 'from-purple-500/20 via-purple-600/15 to-purple-700/20',
      border: 'border-purple-200/60 dark:border-purple-700/50',
      hover: 'hover:from-purple-500/30 hover:via-purple-600/25 hover:to-purple-700/30',
      glow: 'hover:shadow-purple-500/25',
      text: 'text-purple-700 dark:text-purple-300',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    indigo: {
      gradient: 'from-indigo-500/20 via-indigo-600/15 to-indigo-700/20',
      border: 'border-indigo-200/60 dark:border-indigo-700/50',
      hover: 'hover:from-indigo-500/30 hover:via-indigo-600/25 hover:to-indigo-700/30',
      glow: 'hover:shadow-indigo-500/25',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: 'text-indigo-600 dark:text-indigo-400'
    }
  };

  const enhancedColors = enhancedColorClasses[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative group overflow-hidden
        flex flex-col items-center justify-center space-y-2 
        rounded-xl font-semibold border
        bg-gradient-to-br ${enhancedColors.gradient}
        ${enhancedColors.border} ${enhancedColors.text}
        backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:bg-gradient-to-br ${enhancedColors.hover}
        hover:scale-105 hover:shadow-lg ${enhancedColors.glow}
        hover:-translate-y-1
        active:scale-95 active:translate-y-0
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${sizeClasses[size]}
        ${className}
        card-hover-animation
      `}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)'
      }}
    >
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shimmer"></div>
      
      {/* Enhanced icon with bounce animation */}
      <div className={`text-3xl ${enhancedColors.icon} transform transition-transform duration-300 group-hover:scale-110 group-hover:animate-bounce-light`}>
        {icon}
      </div>
      
      {/* Label with improved typography */}
      <span className="font-semibold text-sm leading-tight text-center group-hover:font-bold transition-all duration-300">
        {label}
      </span>
      
      {/* Subtle pulse effect indicator */}
      <div className="absolute top-2 right-2 w-2 h-2 bg-current rounded-full opacity-30 group-hover:opacity-60 animate-pulse"></div>
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
