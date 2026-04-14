import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`flex h-11 w-full rounded-xl border border-white/5 bg-[#0f0f0f] px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600 transition-all font-sans ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
