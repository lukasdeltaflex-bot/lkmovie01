"use client";

import { useState } from "react";
import { signUpWithEmail, signInWithGoogle, sendVerificationEmail } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signUpWithEmail(email, password);
      await sendVerificationEmail(userCredential.user);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else {
        setError(err.message || "Erro desconhecido ao criar conta.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      console.log("Tentando cadastro com Google...");
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Google Registration falhou:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Pop-up bloqueado. Por favor, permita janelas pop-up para continuar.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Cadastro cancelado pelo usuário.");
      } else {
        setError("Erro ao cadastrar com Google: " + (err.message || "Tente novamente."));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-10 duration-500">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-blue-600 mb-2 tracking-tighter">LKMOVIE01</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Crie sua conta gratuita em segundos</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-2xl text-center font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-2xl text-center font-bold">
            Conta criada com sucesso! Redirecionando...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
              autoComplete="email"
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Senha (mín. 6)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:text-white transition-all outline-none"
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 transition-all transform active:scale-95"
          >
            {loading ? "Processando..." : success ? "Sucesso!" : "Criar minha conta"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Ou</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading || success}
          className="w-full py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-2xl font-bold shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-3 text-sm active:scale-95 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Processando..." : "Cadastrar com Google"}
        </button>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 font-medium">
          Já tem conta? <Link href="/login" className="text-blue-600 hover:text-blue-500 font-bold ml-1 hover:underline">Acesse aqui</Link>
        </p>
      </div>
    </div>
  );
}
