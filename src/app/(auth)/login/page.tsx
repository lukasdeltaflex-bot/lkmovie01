"use client";

import { useState } from "react";
import { signInWithEmail, signInWithGoogle, signInWithMicrosoft } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError("Verifique seu e-mail e senha. Detalhe: " + (err.message || "Erro desconhecido."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro no Google Auth:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Pop-up bloqueado. Permita janelas pop-up para este site.");
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError("Erro ao autenticar com Google: " + err.message);
      }
    }
  };

  const handleMicrosoftLogin = async () => {
    setError("");
    try {
      await signInWithMicrosoft();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Erro no Microsoft Auth:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Pop-up bloqueado. Permita janelas pop-up para este site.");
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError("Erro com Microsoft. Verifique se o provedor está habilitado no Firebase.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">LKMOVIE01</h1>
          <p className="text-gray-500 dark:text-gray-400">Acesse sua conta para continuar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
               <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Senha</label>
               <Link href="/esqueci-senha" data-testid="forgot-password-link" className="text-xs text-blue-600 hover:text-blue-500 font-bold">Esqueceu a senha?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-lg transition-all transform active:scale-95"
          >
            {loading ? "Entrando..." : "Entrar com E-mail"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ou</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleGoogleLogin}
            className="py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>

          <button
            onClick={handleMicrosoftLogin}
            className="py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            Microsoft
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Novo por aqui? 
          <Link 
            href="/cadastro" 
            className="text-blue-600 hover:text-blue-500 font-bold ml-1 inline-block hover:underline"
            onClick={() => console.log("Navegando para cadastro...")}
          >
            Crie sua conta
          </Link>
        </div>
      </div>
    </div>
  );
}
