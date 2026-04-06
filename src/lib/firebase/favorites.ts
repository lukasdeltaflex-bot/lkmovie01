import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./config";

export interface FavoriteVideo {
  id?: string;
  userId: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  createdAt: any;
}

/**
 * Salva um vídeo nos favoritos
 */
export const addFavorite = async (userId: string, video: any) => {
  if (!db) return;
  const favsRef = collection(db, "user_favorites");
  await addDoc(favsRef, {
    userId,
    videoId: video.id,
    title: video.title,
    thumbnail: video.thumbnail,
    channelTitle: video.channel || video.channelTitle,
    createdAt: serverTimestamp()
  });
};

/**
 * Remove dos favoritos
 */
export const removeFavorite = async (favoriteId: string) => {
  if (!db) return;
  await deleteDoc(doc(db, "user_favorites", favoriteId));
};

/**
 * Busca favoritos do usuário
 */
export const getUserFavorites = async (userId: string) => {
  if (!db) return [];
  const q = query(
    collection(db, "user_favorites"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FavoriteVideo[];
};
