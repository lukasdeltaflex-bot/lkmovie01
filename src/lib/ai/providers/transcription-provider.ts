import { TranscriptSegment } from "@/types/project";

export interface ITranscriptionProvider {
  /**
   * Transcreve um vídeo com base em seu título e duração.
   * Pode ser expandido futuramente para aceitar raw audio/video files.
   */
  transcribe(videoTitle: string, duration: number): Promise<TranscriptSegment[]>;
  
  /**
   * Nome identificador do provider (ex: 'mock', 'whisper')
   */
  readonly name: string;
}
