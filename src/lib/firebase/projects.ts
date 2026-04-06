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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { incrementUserStat } from "./user-settings";
import { SavedProject, ProjectStatus } from "@/types/project";
export type { SavedProject, ProjectStatus };

/**
 * Cria um novo projeto no Firestore com validação de dados
 */
export const createProject = async (projectData: Omit<SavedProject, "id" | "createdAt" | "updatedAt" | "deletedAt" | "status">) => {
  if (!db) throw new Error("Firestore não inicializado");
  if (!projectData.userId) throw new Error("userId é obrigatório");
  if (!projectData.title) throw new Error("Título do projeto é obrigatório");
  if (!projectData.videoId) throw new Error("videoId é obrigatório");

  const projectsRef = collection(db, "projects");
  const dataToSave = {
    ...projectData,
    subtitleSize: Number(projectData.subtitleSize) || 28,
    watermarkOpacity: Number(projectData.watermarkOpacity) || 80,
    watermarkScale: Number(projectData.watermarkScale) || 0.2,
    volumeVideo: Number(projectData.volumeVideo) ?? 1,
    volumeMusic: Number(projectData.volumeMusic) ?? 0.5,
    status: "active" as ProjectStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
  };

  const docRef = await addDoc(projectsRef, dataToSave);
  await Promise.all([
    incrementUserStat(projectData.userId, "usage.projectsCount"),
    incrementUserStat(projectData.userId, "analytics.totalProjects")
  ]);
  return docRef.id;
};

/**
 * duplicateProject - Duplica um projeto existente (Referral + Copy Ready)
 */
export const duplicateProject = async (projectId: string, targetUserId?: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const original = await getProjectById(projectId);
  if (!original) throw new Error("Projeto não encontrado");
  
  const { id, ...data } = original;
  const newData = {
    ...data,
    userId: targetUserId || data.userId, // Permite copiar para outro usuário (Criar igual)
    title: targetUserId ? `Cópia: ${data.title}` : `${data.title} (Cópia)`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    status: "active",
  };
  
  const docRef = await addDoc(collection(db, "projects"), newData);
  if (targetUserId) {
    await incrementUserStat(targetUserId, "usage.projectsCount");
  }
  return docRef.id;
};

/**
 * Outras funções de projeto
 */
export const updateProject = async (projectId: string, projectData: Partial<SavedProject>) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, { ...projectData, updatedAt: serverTimestamp() });
};

export const getUserProjects = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavedProject[];
};

export const getProjectById = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docSnap = await getDoc(doc(db, "projects", projectId));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as SavedProject;
  return null;
};

export const softDeleteProject = async (projectId: string) => {
  if (!db) return;
  await updateDoc(doc(db, "projects", projectId), { status: "deleted", deletedAt: serverTimestamp() });
};

export const hardDeleteProject = async (projectId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "projects", projectId));
};

export const getDeletedProjects = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId),
    where("status", "==", "deleted"),
    orderBy("deletedAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavedProject[];
};

export const restoreProject = async (projectId: string) => {
  if (!db) return;
  await updateDoc(doc(db, "projects", projectId), { 
    status: "active", 
    deletedAt: null,
    updatedAt: serverTimestamp() 
  });
};

export const getRecentProjects = async (userId: string, limitCount: number = 4) => {
  if (!db) throw new Error("Firestore não inicializado");
  const q = query(
    collection(db, "projects"), 
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavedProject[];
};
