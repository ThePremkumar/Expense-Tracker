import React, { forwardRef } from 'react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    value: string;
    label: string;
  }[];
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        }
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border-slate-300 shadow-sm
            focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
            ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300'}
            ${className}
          `}
          {...props}>

          <option value="" disabled>
            Select an option
          </option>
          {options.map((opt) =>
          <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      </div>);

  }
);
Select.displayName = 'Select';