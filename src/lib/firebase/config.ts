import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
 
const firebaseConfig = {
   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
 
// Validação rigorosa das variáveis de ambiente
const missingKeys = Object.entries(firebaseConfig)
   .filter(([_, value]) => !value)
   .map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.replace(/[A-Z]/g, letter => `_${letter.toUpperCase()}`).toUpperCase()}`);
 
if (missingKeys.length > 0 && typeof window !== 'undefined') {
   console.error("❌ ERRO: Variáveis de ambiente do Firebase ausentes:", missingKeys.join(", "));
}
 
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
 
// Inicialização segura para Vercel e Local (SSR e CSR)
const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
 
if (isConfigValid) {
   try {
     app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
     auth = getAuth(app);
     db = getFirestore(app);
     storage = getStorage(app);
   } catch (error) {
     console.error("❌ ERRO na inicialização do Firebase:", error);
   }
}
 
export { app, auth, db, storage };
