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

export const signUpWithEmail = (email: string, pass: string) => 
  createUserWithEmailAndPassword(auth, email, pass);

export const signInWithEmail = (email: string, pass: string) => 
  signInWithEmailAndPassword(auth, email, pass);

export const signInWithGoogle = () => 
  signInWithPopup(auth, googleProvider);

export const sendVerificationEmail = (user: User) => 
  sendEmailVerification(user);

export const sendResetPasswordEmail = (email: string) => 
  sendPasswordResetEmail(auth, email);

export const signOutUser = () => 
  signOut(auth);
