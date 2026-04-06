import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
}

export function Button({ 
  className = "", 
  variant = "primary", 
  size = "md",
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 active:scale-95 select-none";
  
  const sizes = {
    sm: "h-9 px-4 text-[10px]",
    md: "h-11 px-6",
    lg: "h-14 px-8 text-sm",
    xl: "h-20 px-12 text-lg",
  };

  const variants = {
    primary: "bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400 shadow-lg shadow-blue-500/20",
    secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent shadow-sm",
    outline: "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white shadow-sm hover:border-gray-300 dark:hover:border-gray-500",
    ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
