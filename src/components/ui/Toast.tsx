"use client";

import React, { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Espera a animação de saída
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500",
  }[type];

  return (
    <div 
      className={`fixed top-6 right-6 z-[100] max-w-xs w-full p-4 rounded-2xl shadow-2xl text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all duration-300 transform ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      } ${bgColor}`}
    >
      <span className="text-xl">
        {type === "success" ? "✅" : type === "error" ? "❌" : type === "info" ? "ℹ️" : "⚠️"}
      </span>
      <p className="flex-1">{message}</p>
      <button onClick={() => setIsVisible(false)} className="opacity-50 hover:opacity-100">✕</button>
    </div>
  );
};
