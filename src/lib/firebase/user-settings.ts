import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { UserSettings, UserBranding } from "@/types/project.d";

/**
 * Busca as configurações (branding e modo) de um usuário
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "user_settings", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { userId, ...docSnap.data() } as UserSettings;
  }
  return null;
};

/**
 * Salva as configurações de um usuário
 */
export const saveUserSettings = async (userId: string, settings: UserBranding) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "user_settings", userId);
  await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
