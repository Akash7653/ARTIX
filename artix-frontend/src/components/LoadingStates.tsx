import React from 'react';

/**
 * Loading Spinner Component
 * Shows animated loading indicator during async operations
 */
export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className={`${sizeClasses[size]} relative animate-spin`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-75"></div>
        <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full"></div>
      </div>
      {text && <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">{text}</p>}
    </div>
  );
}

/**
 * Skeleton Loader Component
 * Shows placeholder while content loads
 */
export function SkeletonLoader({ count = 3, type = 'text' }) {
  if (type === 'card') {
    return (
      <div className="space-y-4">
        {Array(count).fill(0).map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

/**
 * Table Skeleton Loader
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="space-y-3">
      {Array(rows).fill(0).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-3 animate-pulse">
          {Array(columns).fill(0).map((_, colIdx) => (
            <div key={colIdx} className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Button with Loading State
 */
export function LoadingButton({ 
  isLoading = false, 
  disabled = false, 
  children, 
  className = '',
  ...props 
}) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`relative disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </span>
      )}
      <span className={isLoading ? 'invisible' : 'visible'}>{children}</span>
    </button>
  );
}

/**
 * Progress Bar Component
 */
export function ProgressBar({ progress = 0, label = '', showPercent = true }) {
  return (
    <div className="w-full">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
          style={{ width: `${Math.min(100, progress)}%` }}
        ></div>
      </div>
      {showPercent && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{Math.round(progress)}%</p>}
    </div>
  );
}

export default {
  LoadingSpinner,
  SkeletonLoader,
  TableSkeleton,
  LoadingButton,
  ProgressBar
};
