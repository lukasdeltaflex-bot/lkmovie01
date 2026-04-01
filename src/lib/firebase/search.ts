import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./config";

export interface SearchRecord {
  id?: string;
  userId: string;
  query: string;
  createdAt: Timestamp;
}

/**
 * Salva uma nova busca no histórico do usuário
 */
export const saveSearchQuery = async (userId: string, queryString: string) => {
  if (!db) return;
  try {
    // Evitar salvar buscas repetidas seguidas se necessário, 
    // mas por simplicidade salvaremos todas por enquanto.
    await addDoc(collection(db, "user_searches"), {
      userId,
      query: queryString,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Erro ao salvar histórico de busca:", error);
  }
};

/**
 * Busca o histórico recente do usuário
 */
export const getUserSearchHistory = async (userId: string, maxResults = 5) => {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "user_searches"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SearchRecord[];
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return [];
  }
};

/**
 * Sugestões baseadas em nicho (estático por enquanto, evoluindo para IA)
 */
export const getNicheSuggestions = () => {
  return [
    { label: "Cinematic", terms: ["Interstellar 4k", "Batman 4k", "Blade Runner 2049"] },
    { label: "Games", terms: ["Cyberpunk 2077 Night City", "Elden Ring Boss Fight", "GTA V Chaos"] },
    { label: "Nature", terms: ["Deep Ocean 4k", "Space Galaxy 8k", "Rainforest Sounds"] },
    { label: "Motivação", terms: ["Jordan Peterson Motivation", "Rocky Balboa Training", "Steve Jobs Speech"] }
  ];
};
