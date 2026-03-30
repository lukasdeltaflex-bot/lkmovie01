import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider,
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut, 
  User 
} from "firebase/auth";
import { auth } from "./config";

// Providers
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

// Email/Password
export const signUpWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithEmailAndPassword(auth, email, pass);
};

// Social Logins
export const signInWithGoogle = () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  // Forçar seleção de conta para evitar erros de sessão persistente no build
  googleProvider.setCustomParameters({ prompt: 'select_account' });
  
  return signInWithPopup(auth, googleProvider);
};

export const signInWithMicrosoft = () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  
  // Configurações recomendadas para Microsoft Azure AD
  microsoftProvider.setCustomParameters({ prompt: 'select_account' });
  
  return signInWithPopup(auth, microsoftProvider);
};

// Utilities
export const sendVerificationEmail = (user: User) => {
  if (!auth) return Promise.resolve();
  return sendEmailVerification(user);
};

export const sendResetPasswordEmail = (email: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return sendPasswordResetEmail(auth, email);
};

export const signOutUser = () => {
  if (!auth) return Promise.resolve();
  return signOut(auth);
};
