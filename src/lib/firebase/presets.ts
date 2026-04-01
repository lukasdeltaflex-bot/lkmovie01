import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";

export interface EditorPreset {
  id?: string;
  userId: string;
  name: string;
  type: "subtitle" | "watermark";
  data: {
    color?: string;
    size?: number | string;
    opacity?: number;
    position?: string;
    x?: number;
    y?: number;
    language?: string;
  };
  createdAt: any;
}

/**
 * Salva um novo preset de editor para o usuário
 */
export const saveEditorPreset = async (preset: Omit<EditorPreset, "id" | "createdAt">) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = await addDoc(collection(db, "user_presets"), {
    ...preset,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Busca todos os presets de um usuário
 */
export const getUserPresets = async (userId: string, type?: "subtitle" | "watermark") => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const presetsRef = collection(db, "user_presets");
  let q = query(
    presetsRef, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  if (type) {
    q = query(q, where("type", "==", type));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as EditorPreset[];
};

/**
 * Exclui um preset
 */
export const deleteEditorPreset = async (id: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  await deleteDoc(doc(db, "user_presets", id));
};
