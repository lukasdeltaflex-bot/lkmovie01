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
  if (!auth) throw new Error("Firebase Auth não inicializado.");
  
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.error("Erro no Google Auth:", error);
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
