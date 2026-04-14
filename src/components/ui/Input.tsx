import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`flex h-11 w-full rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f0f0f] px-4 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600/50 dark:focus:border-blue-600 transition-all font-sans ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
