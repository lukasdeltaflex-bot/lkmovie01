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
  const baseStyles = "inline-flex items-center justify-center rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 active:scale-95 select-none font-display";
  
  const sizes = {
    sm: "h-9 px-4",
    md: "h-11 px-6",
    lg: "h-14 px-8 text-[12px]",
    xl: "h-16 px-10 text-sm",
  };

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/10",
    secondary: "bg-[#1a1a1a] text-white hover:bg-[#252525] border border-white/5",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
    danger: "bg-red-600 text-white hover:bg-red-500 shadow-xl shadow-red-600/10",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
