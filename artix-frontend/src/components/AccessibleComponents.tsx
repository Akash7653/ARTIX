import React, { ReactNode, useState } from 'react';

/**
 * Accessible Form Input Component
 * Implements WCAG 2.1 Level AA standards
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  ariaDescribedBy?: string;
}

export function AccessibleInput({
  label,
  error,
  helperText,
  required,
  id,
  ariaDescribedBy,
  className = '',
  ...props
}: AccessibleInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  
  const describedBy = [
    ariaDescribedBy,
    error ? errorId : null,
    helperText ? helperId : null
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy || undefined}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible Select Component
 */
interface AccessibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function AccessibleSelect({
  label,
  options,
  error,
  helperText,
  required,
  id,
  className = '',
  ...props
}: AccessibleSelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null
  ].filter(Boolean).join(' ');

  return (
    <div className="mb-4">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      <select
        id={selectId}
        aria-describedby={describedBy || undefined}
        aria-invalid={!!error}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
        {...props}
      >
        <option value="">-- Select {label.toLowerCase()} --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible Checkbox Component
 */
interface AccessibleCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AccessibleCheckbox({
  label,
  error,
  id,
  className = '',
  ...props
}: AccessibleCheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${checkboxId}-error`;

  return (
    <div className="mb-4">
      <div className="flex items-center">
        <input
          id={checkboxId}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-4 h-4 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`}
          {...props}
        />
        <label htmlFor={checkboxId} className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          {label}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible Button Component
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
  ariaLabel?: string;
}

export function AccessibleButton({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled = false,
  ariaLabel,
  className = '',
  ...props
}: AccessibleButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      disabled={isLoading || disabled}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`
        font-medium rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {isLoading && (
        <span className="inline-block mr-2 animate-spin">⟳</span>
      )}
      {children}
    </button>
  );
}

/**
 * Skip to Main Content Link
 * Improves keyboard navigation for screen readers
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute top-0 left-0 -translate-y-full focus:translate-y-0 bg-blue-600 text-white px-4 py-2 rounded-b-lg transition-transform"
    >
      Skip to main content
    </a>
  );
}

/**
 * Accessible Tooltip Component
 */
interface AccessibleTooltipProps {
  children: ReactNode;
  tooltip: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function AccessibleTooltip({
  children,
  tooltip,
  position = 'top'
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-describedby={tooltipId}
        tabIndex={0}
      >
        {children}
      </div>
      {isVisible && (
        <div
          id={tooltipId}
          className={`absolute ${positionClasses[position]} bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50`}
          role="tooltip"
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

export default {
  AccessibleInput,
  AccessibleSelect,
  AccessibleCheckbox,
  AccessibleButton,
  SkipLink,
  AccessibleTooltip
};
