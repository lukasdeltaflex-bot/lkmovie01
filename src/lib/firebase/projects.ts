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
  limit,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";

export interface SavedProject {
  id?: string;
  userId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  
  // Subtitle
  subtitleText: string;
  subtitleLanguage: string;
  subtitleColor: string;
  subtitleSize: string;
  subtitlePosition: string;

  // Watermark
  watermarkUrl: string;
  watermarkOpacity: number;
  watermarkSize: number;
  watermarkPosition: string;
  watermarkX?: number;
  watermarkY?: number;

  // Layout
  aspectRatio: "16:9" | "9:16" | "1:1";

  // Final Logo
  endScreenUrl: string;

  // New in Phase 8
  status: "Draft" | "Rendering" | "Ready";

  // Metadata
  deletedAt?: any;
  createdAt: any;
  updatedAt: any;
}

/**
 * Cria um novo projeto no Firestore
 */
export const createProject = async (projectData: Omit<SavedProject, "createdAt" | "updatedAt">) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const projectsRef = collection(db, "projects");
  const dataToSave = {
    ...projectData,
    status: "Draft",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(projectsRef, dataToSave);
  return docRef.id;
};

/**
 * Atualiza um projeto existente
 */
export const updateProject = async (projectId: string, projectData: Partial<SavedProject>) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    ...projectData,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Busca todos os projetos ativos de um usuário (não deletados)
 */
export const getUserProjects = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");

  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef, 
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};

/**
 * Busca projetos deletados (para a lixeira)
 */
export const getDeletedProjects = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");

  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef, 
    where("userId", "==", userId),
    where("deletedAt", "!=", null),
    orderBy("deletedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};

/**
 * Move projeto para a lixeira (Soft Delete)
 */
export const deleteProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
  });
};

/**
 * Restaura projeto da lixeira
 */
export const restoreProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    deletedAt: null,
  });
};

/**
 * Deleta permanentemente
 */
export const hardDeleteProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  await deleteDoc(doc(db, "projects", projectId));
};

/**
 * Duplica um projeto existente
 */
export const duplicateProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const originalDoc = await getDoc(doc(db, "projects", projectId));
  if (!originalDoc.exists()) throw new Error("Projeto não encontrado");
  
  const data = originalDoc.data() as SavedProject;
  const newData = {
    ...data,
    title: `${data.title} (Cópia)`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };
  
  delete (newData as any).id;
  
  const docRef = await addDoc(collection(db, "projects"), newData);
  return docRef.id;
};

/**
 * Busca apenas os projetos mais recentes para o Dashboard
 */
export const getRecentProjects = async (userId: string, maxResults = 3) => {
  if (!db) throw new Error("Firestore não inicializado");

  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef, 
    where("userId", "==", userId),
    where("deletedAt", "==", null),
    orderBy("updatedAt", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};
