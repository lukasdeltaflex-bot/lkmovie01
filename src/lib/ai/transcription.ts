import { TranscriptSegment } from "@/types/project";

/**
 * Simula a transcrição de um vídeo com segmentos temporais realistas.
 * Em produção, aqui seria feita a chamada para Whisper, Deepgram ou Azure Speech.
 */
export async function transcribeVideo(videoTitle: string, duration: number = 30): Promise<TranscriptSegment[]> {
  // Simulação de tempo de processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  const words = videoTitle.split(" ");
  const segments: TranscriptSegment[] = [];
  
  // Criar segmentos baseados no título para parecer real
  // Dividimos a duração pela quantidade de palavras ou frases
  const phraseCount = Math.max(1, Math.floor(duration / 3));
  const segmentDuration = duration / phraseCount;

  for (let i = 0; i < phraseCount; i++) {
    const start = i * segmentDuration;
    const end = (i + 1) * segmentDuration;
    
    // Texto Mockado baseada no contexto ou genérico "Viral"
    const mockTexts = [
      "Bem-vindos ao futuro da edição com IA.",
      "Hoje vamos aprender a criar vídeos virais.",
      "A chave do sucesso é a consistência.",
      "Use cenas épicas para prender a atenção.",
      "As legendas dinâmicas aumentam a retenção.",
      "Siga para mais dicas cinematográficas.",
      "LKMOVIE é a sua ferramenta definitiva.",
      "Transforme ideias em realidade agora mesmo."
    ];

    segments.push({
      start,
      end,
      text: mockTexts[i % mockTexts.length],
      language: "pt-BR"
    });
  }

  return segments;
}

/**
 * Gera a versão em inglês da transcrição (Tradução Mockada)
 */
export async function translateTranscript(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
  const translations: Record<string, string> = {
    "Bem-vindos ao futuro da edição com IA.": "Welcome to the future of AI editing.",
    "Hoje vamos aprender a criar vídeos virais.": "Today we will learn how to create viral videos.",
    "A chave do sucesso é a consistência.": "The key to success is consistency.",
    "Use cenas épicas para prender a atenção.": "Use epic scenes to grab attention.",
    "As legendas dinâmicas aumentam a retenção.": "Dynamic captions increase retention.",
    "Siga para mais dicas cinematográficas.": "Follow for more cinematic tips.",
    "LKMOVIE é a sua ferramenta definitiva.": "LKMOVIE is your definitive tool.",
    "Transforme ideias em realidade agora mesmo.": "Transform ideas into reality right now."
  };

  return segments.map(s => ({
    ...s,
    text: translations[s.text] || `[EN] ${s.text}`,
    language: "en"
  }));
}
