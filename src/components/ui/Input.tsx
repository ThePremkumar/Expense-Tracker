import React, { forwardRef } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label &&
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        }
        <div className="relative">
          {icon &&
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          }
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border-slate-300 shadow-sm
              focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm
              disabled:bg-slate-50 disabled:text-slate-500
              ${icon ? 'pl-10' : 'pl-3'}
              ${error ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300'}
              ${className}
            `}
            {...props} />

        </div>
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      </div>);

  }
);
Input.displayName = 'Input';