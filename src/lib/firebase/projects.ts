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
  
  // Validação de campos obrigatórios
  if (!projectData.userId) throw new Error("userId é obrigatório");
  if (!projectData.title) throw new Error("Título do projeto é obrigatório");
  if (!projectData.videoId) throw new Error("videoId é obrigatório");

  const projectsRef = collection(db, "projects");
  const dataToSave = {
    ...projectData,
    // Sanitização de valores numéricos para garantir estabilidade no FFmpeg
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
  
  // Atualizar Analytics e Uso (SaaS)
  await Promise.all([
    incrementUserStat(projectData.userId, "usage.projectsCount"),
    incrementUserStat(projectData.userId, "analytics.totalProjects")
  ]);

  return docRef.id;
};

/**
 * Atualiza um projeto existente com validação parcial
 */
export const updateProject = async (projectId: string, projectData: Partial<SavedProject>) => {
  if (!db) throw new Error("Firestore não inicializado");
  if (!projectId) throw new Error("projectId é necessário para atualização");
  
  const docRef = doc(db, "projects", projectId);
  
  // Filtrar campos que não devem ser editados via updateProject genérico ou sanitizar
  const sanitizedData: any = { ...projectData };
  if (sanitizedData.subtitleSize !== undefined) sanitizedData.subtitleSize = Number(sanitizedData.subtitleSize);
  if (sanitizedData.watermarkScale !== undefined) sanitizedData.watermarkScale = Number(sanitizedData.watermarkScale);
  if (sanitizedData.volumeVideo !== undefined) sanitizedData.volumeVideo = Number(sanitizedData.volumeVideo);
  if (sanitizedData.volumeMusic !== undefined) sanitizedData.volumeMusic = Number(sanitizedData.volumeMusic);

  await updateDoc(docRef, {
    ...sanitizedData,
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
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};

/**
 * Busca os N projetos mais recentes ativos de um usuário
 */
export const getRecentProjects = async (userId: string, limitCount: number = 4) => {
  if (!db) throw new Error("Firestore não inicializado");

  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef, 
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
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
    where("status", "==", "deleted"),
    orderBy("deletedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};

/**
 * softDeleteProject - Move projeto para a lixeira
 */
export const softDeleteProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    status: "deleted",
    deletedAt: serverTimestamp(),
  });
};

/**
 * restoreProject - Restaura projeto da lixeira
 */
export const restoreProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    status: "active",
    deletedAt: null,
  });
};

/**
 * Busca um projeto específico pelo ID
 */
export const getProjectById = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as SavedProject;
  }
  return null;
};

/**
 * duplicateProject - Duplica um projeto existente
 */
export const duplicateProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const original = await getProjectById(projectId);
  if (!original) throw new Error("Projeto não encontrado");
  
  const { id, ...data } = original;
  const newData = {
    ...data,
    title: `${data.title} (Cópia)`,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    status: "active",
  };
  
  const docRef = await addDoc(collection(db, "projects"), newData);
  return docRef.id;
};

/**
 * Deleta permanentemente
 */
export const hardDeleteProject = async (projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  await deleteDoc(doc(db, "projects", projectId));
};
