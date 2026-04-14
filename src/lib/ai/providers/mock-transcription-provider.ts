import { TranscriptSegment } from "@/types/project";
import { ITranscriptionProvider } from "./transcription-provider";

export class MockTranscriptionProvider implements ITranscriptionProvider {
  readonly name = "mock";

  async transcribe(videoTitle: string, duration: number = 30): Promise<TranscriptSegment[]> {
    // Simulação de tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    const segments: TranscriptSegment[] = [];
    
    // Divide a duração em frases de aproximadamente 3 segundos
    const phraseCount = Math.max(1, Math.floor(duration / 3));
    const segmentDuration = duration / phraseCount;

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

    for (let i = 0; i < phraseCount; i++) {
      segments.push({
        start: i * segmentDuration,
        end: (i + 1) * segmentDuration,
        text: mockTexts[i % mockTexts.length],
        language: "pt-BR"
      });
    }

    return segments;
  }
}
