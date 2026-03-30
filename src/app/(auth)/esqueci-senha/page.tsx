"use client";

import { useState } from "react";
import { sendResetPasswordEmail } from "@/lib/firebase/auth";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await sendResetPasswordEmail(email);
      setMessage("Se o e-mail estiver cadastrado, você receberá um link de redefinição em instantes.");
    } catch (err: any) {
      setError("Não foi possível processar a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-top-10 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">LKMOVIE01</h1>
          <p className="text-gray-500 dark:text-gray-400">Recupere o acesso à sua conta</p>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-xl text-center font-medium">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleResetRequest} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">E-mail de cadastro</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg transition-all transform active:scale-95"
          >
            {loading ? "Processando..." : "Enviar link de recuperação"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500 font-bold flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
}
