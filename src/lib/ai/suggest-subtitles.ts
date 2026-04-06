import { model } from "./config";

export async function suggestSubtitles(videoTitle: string, context?: string): Promise<{ pt: string; en: string }[]> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return [
      { pt: "NOVA LEGENDA AQUI", en: "NEW SUBTITLE HERE" },
      { pt: "DIGITE SEU TEXTO", en: "TYPE YOUR TEXT" },
      { pt: "GANCHO VIRAL", en: "VIRAL HOOK" },
    ];
  }

  try {
    const prompt = `
      Você é um copywriter especialista em vídeos curtos (TikTok, Reels, Shorts).
      Sua tarefa é gerar 3 opções de legendas/ganchos (hooks) impactantes e virais.
      Cada opção deve ter uma versão em Português (PT) e uma versão traduzida equivalente em Inglês (EN).
      
      O vídeo se chama: "${videoTitle}".
      Contexto extra: "${context || "Sem contexto adicional"}".

      Regras:
      1. Retorne as 3 opções no formato JSON: [{"pt": "...", "en": "..."}, ...]
      2. As legendas devem ser curtas (máximo 12 palavras por idioma).
      3. Use um tom cativante, emocional ou de curiosidade.
      4. Retorne APENAS o JSON válido.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Extrair JSON da resposta caso a IA use markdown
    const jsonMatch = text.match(/\[.*\]/s);
    const jsonString = jsonMatch ? jsonMatch[0] : text;

    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Erro ao parsear JSON da IA:", text);
      return [{ pt: "Erro ao gerar", en: "Generation error" }];
    }
  } catch (error) {
    console.error("Erro na sugestão de legendas:", error);
    return [{ pt: "LEGENDAS INDISPONÍVEIS", en: "SUBTITLES UNAVAILABLE" }];
  }
}

