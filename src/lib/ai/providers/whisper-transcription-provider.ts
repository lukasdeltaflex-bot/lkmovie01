import { TranscriptSegment } from "@/types/project";
import { ITranscriptionProvider } from "./transcription-provider";

export class WhisperTranscriptionProvider implements ITranscriptionProvider {
  readonly name = "whisper";

  async transcribe(videoUrl: string, duration: number): Promise<TranscriptSegment[]> {
    /**
     * TODO: Implementar integração real com OpenAI Whisper
     * 1. Baixar audio do videoUrl
     * 2. Enviar para Whisper API
     * 3. Mapear resposta para TranscriptSegment[]
     */
    console.log(`[WhisperProvider] Transcrevendo vídeo de ${duration}s...`);
    
    // Fallback temporário para evitar quebra no desenvolvimento
    throw new Error("WhisperTranscriptionProvider ainda não está configurado. Use o MockProvider.");
  }
}
