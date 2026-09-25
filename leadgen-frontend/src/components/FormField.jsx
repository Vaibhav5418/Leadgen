import React from 'react';

export default function FormField({
  label,
  id,
  error,
  required,
  optional,
  children,
  helperText,
  className = '',
  labelClassName = ''
}) {
  return (
    <div className={`form-field-group ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-xs font-semibold text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
          {optional && <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
        </label>
      )}
      {children}
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
