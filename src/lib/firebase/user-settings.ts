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
import { v4 as uuidv4 } from "uuid";

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
 * Busca ou inicializa as configurações de um usuário (SaaS + Referral Ready)
 */
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "user_settings", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { userId, ...docSnap.data() } as UserSettings;
  }

  // Inicialização para novos usuários
  const newSettings: any = {
    ...DEFAULT_BRANDING,
    plan: "free",
    referralCode: uuidv4().split("-")[0].toUpperCase(), // Gera código curto
    hasSeenOnboarding: false,
    usage: {
      searchesCount: 0,
      projectsCount: 0,
      rendersCount: 0,
      referralsCount: 0,
      lastResetAt: serverTimestamp()
    },
    analytics: {
      totalSearches: 0,
      totalProjects: 0,
      totalRenders: 0,
      lastLoginAt: serverTimestamp(),
      lastProjectAt: null
    },
    updatedAt: serverTimestamp()
  };

  await setDoc(docRef, newSettings);
  return { userId, ...newSettings } as UserSettings;
};

/**
 * Aplica bônus de indicação
 */
export const applyReferralBonus = async (referrerId: string, referralId: string) => {
  if (!db) return;
  const referrerRef = doc(db, "user_settings", referrerId);
  const referralRef = doc(db, "user_settings", referralId);

  await Promise.all([
    // Bônus para quem indicou (+5 projetos, +2 renders)
    updateDoc(referrerRef, {
      "usage.projectsCount": increment(-5), // Incremento negativo em uso = aumento de limite efetivo
      "usage.rendersCount": increment(-2),
      "usage.referralsCount": increment(1),
      updatedAt: serverTimestamp()
    }),
    // Flag de quem foi indicado
    updateDoc(referralRef, {
      referredBy: referrerId,
      updatedAt: serverTimestamp()
    })
  ]);
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
