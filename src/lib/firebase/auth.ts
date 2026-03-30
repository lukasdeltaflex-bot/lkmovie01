import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut, 
  User 
} from "firebase/auth";
import { auth } from "./config";

// Providers
const googleProvider = new GoogleAuthProvider();

// Email/Password
export const signUpWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado ou sem chaves de API.");
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado ou sem chaves de API.");
  return signInWithEmailAndPassword(auth, email, pass);
};

// Social Logins
export const signInWithGoogle = async () => {
  if (!auth) {
    console.error("Firebase Auth instance is null. Check environment variables.");
    throw new Error("Erro de configuração de autenticação. O serviço não foi inicializado.");
  }
  
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error("Erro detalhado no Google Auth:", {
      code: error.code,
      message: error.message,
      full: error
    });
    throw error;
  }
};

// Utilities
export const sendVerificationEmail = (user: User) => {
  if (!auth) return Promise.resolve();
  return sendEmailVerification(user);
};

export const sendResetPasswordEmail = (email: string) => {
  if (!auth) throw new Error("Firebase Auth não inicializado.");
  return sendPasswordResetEmail(auth, email);
};

export const signOutUser = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};
