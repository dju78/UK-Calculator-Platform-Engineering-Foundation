import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, "aria-describedby": describedBy, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;
    const errorId = `${inputId}-error`;
    // Keep any caller-supplied description AND point at the error when present.
    const describedByIds = [describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          // placeholder:text-slate-500 rather than slate-400: slate-400 on white
          // is 2.56:1, below the WCAG AA 4.5:1 minimum for text.
          className={`flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-red-700 focus:ring-red-700" : ""
          } ${className}`}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          {...props}
        />
        {/* red-700 rather than red-500: an error a user cannot read is not an
            error message. role="alert" makes screen readers announce it. */}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
