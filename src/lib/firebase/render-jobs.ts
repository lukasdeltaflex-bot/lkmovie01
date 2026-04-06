import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";
import { RenderJob, RenderStatus } from "@/types/render";

/**
 * Cria um novo job de renderização
 */
export const createRenderJob = async (userId: string, projectId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const jobsRef = collection(db, "renderJobs");
  const data = {
    userId,
    projectId,
    status: "pending",
    progress: 0,
    outputUrl: null,
    errorMessage: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(jobsRef, data);
  return docRef.id;
};

/**
 * Atualiza o status e/ou progresso de um job
 */
export const updateRenderJob = async (jobId: string, data: Partial<Omit<RenderJob, "id" | "userId" | "projectId" | "createdAt">>) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const docRef = doc(db, "renderJobs", jobId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Busca todos os jobs de um usuário
 */
export const getUserRenderJobs = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");

  const jobsRef = collection(db, "renderJobs");
  const q = query(
    jobsRef, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as RenderJob[];
};

/**
 * Busca um job específico pelo ID
 */
export const getRenderJobById = async (jobId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const docRef = doc(db, "renderJobs", jobId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as RenderJob;
  }
  return null;
};

/**
 * Busca o último job de um usuário
 */
export const getLastUserRenderJob = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");
  const jobsRef = collection(db, "renderJobs");
  const q = query(
    jobsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as RenderJob;
  }
  return null;
};
