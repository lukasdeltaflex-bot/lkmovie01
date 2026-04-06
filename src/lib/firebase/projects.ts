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
import { SavedProject } from "@/types/project.d";

/**
 * Cria um novo projeto no Firestore
 */
export const createProject = async (projectData: Omit<SavedProject, "id" | "createdAt" | "updatedAt" | "deletedAt" | "status">) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const projectsRef = collection(db, "projects");
  const dataToSave = {
    ...projectData,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
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
