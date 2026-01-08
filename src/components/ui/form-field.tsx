import { useState, useEffect } from "react";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: FieldError;
  required?: boolean;
  description?: string;
  success?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  placeholder,
  error,
  required,
  description,
  success,
  value,
  onChange,
  onBlur,
  className
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasInteracted(true);
    onBlur?.(e);
  };

  const showError = error && (hasInteracted || isFocused);
  const showSuccess = success && hasInteracted && !error;

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={name}
        className={cn(
          "block text-sm font-medium transition-colors duration-200",
          showError && "text-destructive",
          showSuccess && "text-green-700",
          !showError && !showSuccess && "text-gray-700"
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            "transition-all duration-200",
            showError && "border-destructive focus-visible:ring-destructive/20",
            showSuccess && "border-green-500 focus-visible:ring-green-500/20",
            isFocused && !showError && !showSuccess && "border-blue-500 focus-visible:ring-blue-500/20"
          )}
        />

        {/* Status Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {showError && (
            <svg
              className="h-5 w-5 text-destructive animate-in fade-in-0 zoom-in-95"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {showSuccess && (
            <svg
              className="h-5 w-5 text-green-600 animate-in fade-in-0 zoom-in-95"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Error Message */}
      {showError && (
        <div className="flex items-center space-x-1 animate-in slide-in-from-top-1 fade-in-0">
          <svg
            className="h-4 w-4 text-destructive flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center space-x-1 animate-in slide-in-from-top-1 fade-in-0">
          <svg
            className="h-4 w-4 text-green-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm text-green-700">Looks good!</p>
        </div>
      )}
    </div>
  );
}

interface TextareaFieldProps extends Omit<FormFieldProps, 'type'> {
  rows?: number;
}

export function TextareaField({
  label,
  name,
  placeholder,
  error,
  required,
  description,
  success,
  value,
  onChange,
  onBlur,
  rows = 3,
  className
}: TextareaFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasInteracted(true);
    onBlur?.(e as any);
  };

  const showError = error && (hasInteracted || isFocused);
  const showSuccess = success && hasInteracted && !error;

  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={name}
        className={cn(
          "block text-sm font-medium transition-colors duration-200",
          showError && "text-destructive",
          showSuccess && "text-green-700",
          !showError && !showSuccess && "text-gray-700"
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      <div className="relative">
        <textarea
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange as any}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={rows}
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none",
            showError && "border-destructive focus-visible:ring-destructive/20",
            showSuccess && "border-green-500 focus-visible:ring-green-500/20",
            isFocused && !showError && !showSuccess && "border-blue-500 focus-visible:ring-blue-500/20"
          )}
        />

        {/* Status Icon */}
        <div className="absolute top-3 right-3 pointer-events-none">
          {showError && (
            <svg
              className="h-5 w-5 text-destructive animate-in fade-in-0 zoom-in-95"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {showSuccess && (
            <svg
              className="h-5 w-5 text-green-600 animate-in fade-in-0 zoom-in-95"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Error Message */}
      {showError && (
        <div className="flex items-center space-x-1 animate-in slide-in-from-top-1 fade-in-0">
          <svg
            className="h-4 w-4 text-destructive flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center space-x-1 animate-in slide-in-from-top-1 fade-in-0">
          <svg
            className="h-4 w-4 text-green-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p className="text-sm text-green-700">Looks good!</p>
        </div>
      )}
    </div>
  );
}