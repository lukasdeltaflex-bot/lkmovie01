import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { UserSettings, UserBranding } from "@/types/project.d";

const DEFAULT_BRANDING: UserBranding = {
  systemName: "LKMOVIE PRO",
  logo: "",
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  defaultWatermark: "",
  defaultEndScreen: "",
  appearanceMode: "dark"
};

/**
 * Busca ou inicializa as configurações de um usuário (SaaS Ready)
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "user_settings", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { userId, ...docSnap.data() } as UserSettings;
  }

  // Inicialização para novos usuários (ou usuários antigos sem settings)
  const newSettings: Omit<UserSettings, "userId" | "updatedAt"> = {
    ...DEFAULT_BRANDING,
    plan: "free",
    hasSeenOnboarding: false,
    usage: {
      searchesCount: 0,
      projectsCount: 0,
      rendersCount: 0,
      lastResetAt: serverTimestamp()
    },
    analytics: {
      totalSearches: 0,
      totalProjects: 0,
      totalRenders: 0,
      lastLoginAt: serverTimestamp(),
      lastProjectAt: null
    }
  };

  await setDoc(docRef, { ...newSettings, updatedAt: serverTimestamp() });
  return { userId, ...newSettings, updatedAt: new Date() } as UserSettings;
};

/**
 * Incrementa um contador de uso ou analytics de forma atômica
 */
export const incrementUserStat = async (userId: string, statPath: string) => {
  if (!db) return;
  const docRef = doc(db, "user_settings", userId);
  await updateDoc(docRef, {
    [statPath]: increment(1),
    updatedAt: serverTimestamp()
  });
};

/**
 * Salva as configurações de um usuário
 */
export const saveUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "user_settings", userId);
  await setDoc(docRef, {
    ...settings,
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
