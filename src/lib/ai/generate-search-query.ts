import { SearchQueryOutput } from "./types";

const translationMap: Record<string, string> = {
  "dançando": "dancing",
  "coringa": "joker",
  "escada": "stairs",
  "escadas": "stairs",
  "chuva": "rain",
  "caminhando": "walking",
  "correndo": "running",
  "luta": "fight",
  "lutando": "fighting",
  "carro": "car",
  "perseguição": "chase",
  "beijo": "kiss",
  "chorando": "crying",
  "sorrindo": "smiling",
  "explosão": "explosion",
  "fogo": "fire",
  "floresta": "forest",
  "cidade": "city",
  "noite": "night",
  "dia": "day",
  "praia": "beach",
  "mar": "sea",
  "oceano": "ocean",
  "espaço": "space",
  "futurista": "futuristic",
  "épico": "epic",
  "cinema": "cinematic",
  "lento": "slow motion",
  "rápido": "fast",
  "triste": "sad",
  "feliz": "happy",
  "medo": "fear",
  "ação": "action",
  "terror": "horror"
};

const stopWords = ["na", "no", "o", "a", "os", "as", "um", "uma", "de", "do", "da", "em", "para", "com"];

export async function generateSearchQuery(input: string): Promise<SearchQueryOutput> {
  const words = input.toLowerCase().split(/\s+/);
  
  const filteredWords = words.filter(word => !stopWords.includes(word));
  
  const optimizedWords = filteredWords.map(word => {
    return translationMap[word] || word;
  });

  return {
    originalText: input,
    optimizedQuery: optimizedWords.join(" ")
  };
}
