import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut, 
  User,
  Auth
} from "firebase/auth";
import { auth } from "./config";

// Provedores
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Função interna para validar a instância com erro amigável e detalhado
const getValidatedAuth = (): Auth => {
  if (!auth) {
    const missingKeys = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ].filter(key => !process.env[key]);

    const errorMsg = missingKeys.length > 0 
      ? `Firebase Auth não inicializado. Faltam as variáveis: ${missingKeys.join(", ")}.`
      : "Firebase Auth falhou na inicialização. Verifique o console para erros de configuração.";
    
    throw new Error(errorMsg);
  }
  return auth;
};

// Funções de Autenticação Exportadas

/**
 * Cadastro com E-mail e Senha
 */
export const signUpWithEmail = async (email: string, pass: string) => {
  const firebaseAuth = getValidatedAuth();
  try {
    return await createUserWithEmailAndPassword(firebaseAuth, email, pass);
  } catch (error: any) {
    console.error("signUpWithEmail error code:", error.code);
    throw error;
  }
};

/**
 * Login com E-mail e Senha
 */
export const signInWithEmail = async (email: string, pass: string) => {
  const firebaseAuth = getValidatedAuth();
  try {
    return await signInWithEmailAndPassword(firebaseAuth, email, pass);
  } catch (error: any) {
    console.error("signInWithEmail error code:", error.code);
    throw error;
  }
};

/**
 * Login com Google
 */
export const signInWithGoogle = async () => {
  const firebaseAuth = getValidatedAuth();
  try {
    return await signInWithPopup(firebaseAuth, googleProvider);
  } catch (error: any) {
    console.error("signInWithGoogle error code:", error.code, error.message);
    throw error;
  }
};

/**
 * Envio de E-mail de Verificação
 */
export const sendVerificationEmail = async (user: User) => {
  try {
    return await sendEmailVerification(user);
  } catch (error: any) {
    console.error("sendVerificationEmail error code:", error.code);
    throw error;
  }
};

/**
 * Reset de Senha (E-mail)
 */
export const sendResetPasswordEmail = async (email: string) => {
  const firebaseAuth = getValidatedAuth();
  try {
    return await sendPasswordResetEmail(firebaseAuth, email);
  } catch (error: any) {
    console.error("sendResetPasswordEmail error code:", error.code);
    throw error;
  }
};

/**
 * Logout
 */
export const signOutUser = async () => {
  const firebaseAuth = getValidatedAuth();
  try {
    return await signOut(firebaseAuth);
  } catch (error: any) {
    console.error("signOut error code:", error.code);
    throw error;
  }
};
