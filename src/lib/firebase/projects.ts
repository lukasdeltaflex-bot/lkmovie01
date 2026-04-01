import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
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

  // Final Logo
  endScreenUrl: string;

  createdAt: any;
  updatedAt: any;
}

export const saveProject = async (projectData: Omit<SavedProject, "createdAt" | "updatedAt">) => {
  if (!db) throw new Error("Firestore não inicializado");
  
  const projectsRef = collection(db, "projects");
  const dataToSave = {
    ...projectData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(projectsRef, dataToSave);
  return docRef.id;
};

export const getUserProjects = async (userId: string) => {
  if (!db) throw new Error("Firestore não inicializado");

  const projectsRef = collection(db, "projects");
  const q = query(
    projectsRef, 
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SavedProject[];
};
