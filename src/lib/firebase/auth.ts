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

const googleProvider = new GoogleAuthProvider();

export const signUpWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return createUserWithEmailAndPassword(auth, email, pass);
};

export const signInWithEmail = (email: string, pass: string) => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithEmailAndPassword(auth, email, pass);
};

export const signInWithGoogle = () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInWithPopup(auth, googleProvider);
};

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
