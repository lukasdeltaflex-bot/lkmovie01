import { model } from "./config";

export async function suggestSubtitles(videoTitle: string, context?: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return ["NOVA LEGENDA AQUI", "DIGITE SEU TEXTO", "GANCHO VIRAL"];
  }

  try {
    const prompt = `
      Você é um copywriter especialista em vídeos curtos (TikTok, Reels, Shorts).
      Sua tarefa é gerar 3 opções de legendas/ganchos (hooks) impactantes e virais em português.
      O vídeo se chama: "${videoTitle}".
      Contexto extra: "${context || 'Sem contexto adicional'}".

      Regras:
      1. Retorne apenas as 3 opções, separadas por ponto e vírgula (;).
      2. As legendas devem ser curtas (máximo 12 palavras).
      3. Use um tom cativante, emocional ou de curiosidade.

      Exemplo: "O segredo que ninguém te contou; Isso mudou minha vida; Você não vai acreditar..."
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    return text.split(";").map(s => s.trim()).filter(s => s.length > 0);

  } catch (error) {
    console.error("Erro na sugestão de legendas:", error);
    return ["LEGENDAS INDISPONÍVEIS", "ERRO NA IA"];
  }
}
