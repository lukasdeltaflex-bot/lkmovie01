import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "./config";

export interface UserNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: Timestamp;
}

/**
 * Cria uma nova notificação para o usuário
 */
export const createNotification = async (userId: string, data: Omit<UserNotification, "id" | "userId" | "read" | "createdAt">) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "user_notifications"), {
      userId,
      ...data,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
};

/**
 * Escuta notificações em tempo real
 */
export const subscribeToNotifications = (userId: string, callback: (notifications: UserNotification[]) => void) => {
  if (!db) return () => {};
  
  const q = query(
    collection(db, "user_notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserNotification[];
    callback(notifications);
  });
};

/**
 * Marca uma notificação como lida
 */
export const markAsRead = async (id: string) => {
  if (!db) return;
  try {
    await updateDoc(doc(db, "user_notifications", id), {
      read: true
    });
  } catch (error) {
    console.error("Erro ao marcar como lida:", error);
  }
};

/**
 * Exclui uma notificação
 */
export const deleteNotification = async (id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, "user_notifications", id));
  } catch (error) {
    console.error("Erro ao excluir notificação:", error);
  }
};
