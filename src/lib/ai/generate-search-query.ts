import { SearchQueryOutput } from "./types";
import { model } from "./config";

const translationMap: Record<string, string> = {
  "dançando": "dancing",
  "coringa": "joker",
  "escada": "stairs",
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
  const apiKey = process.env.GOOGLE_AI_KEY;

  // Se não houver API Key, usa a lógica de fallback legada
  if (!apiKey) {
    console.warn("GOOGLE_AI_KEY não encontrada. Usando modo de fallback estático.");
    const words = input.toLowerCase().split(/\s+/);
    const filteredWords = words.filter(word => !stopWords.includes(word));
    const optimizedWords = filteredWords.map(word => translationMap[word] || word);
    
    return {
      originalText: input,
      optimizedQuery: optimizedWords.join(" ")
    };
  }

  try {
    const prompt = `
      Você é um assistente especialista em curadoria de vídeo para criadores de conteúdo (SaaS de Edição).
      Sua tarefa é converter uma busca de usuário em português para uma query de busca otimizada em inglês para YouTube/Pexels.
      O objetivo é encontrar cenas cinematográficas, de alta qualidade (4k, cinematic), que combinem com o sentimento do usuário.

      Regras:
      1. Retorne apenas a query otimizada em inglês.
      2. Adicione termos de estilo se apropriado (ex: "cinematic", "4k", "atmosphere").
      3. Seja conciso.

      Entrada do usuário: "${input}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const optimizedQuery = response.text().trim().replace(/"/g, "");

    return {
      originalText: input,
      optimizedQuery: optimizedQuery
    };

  } catch (error) {
    console.error("Erro na geração de IA:", error);
    // Fallback em caso de erro da API
    return {
      originalText: input,
      optimizedQuery: input // Retorna o original se tudo falhar
    };
  }
}
