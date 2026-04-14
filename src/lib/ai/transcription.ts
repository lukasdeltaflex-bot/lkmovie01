import { TranscriptSegment } from "@/types/project";
import { MockTranscriptionProvider } from "./providers/mock-transcription-provider";
import { WhisperTranscriptionProvider } from "./providers/whisper-transcription-provider";
import { ITranscriptionProvider } from "./providers/transcription-provider";

/**
 * Orchestrator de Transcrição
 * Centraliza a escolha do provedor e utilitários de tradução.
 */
class TranscriptionService {
  private provider: ITranscriptionProvider;

  constructor() {
    // Definimos o provider padrão (Mock)
    // No futuro, isso pode vir de uma variável de ambiente: process.env.TRANSCRIPTION_PROVIDER
    this.provider = new MockTranscriptionProvider();
  }

  /**
   * Altera o provider em tempo de execução se for necessário
   */
  setProvider(providerName: "mock" | "whisper") {
    if (providerName === "whisper") {
      this.provider = new WhisperTranscriptionProvider();
    } else {
      this.provider = new MockTranscriptionProvider();
    }
  }

  /**
   * Transcreve um vídeo usando o provider ativo
   */
  async transcribe(videoTitle: string, duration: number = 30): Promise<TranscriptSegment[]> {
    return this.provider.transcribe(videoTitle, duration);
  }

  /**
   * Gera a versão em inglês da transcrição (Tradução Mockada/Utility)
   */
  async translate(segments: TranscriptSegment[]): Promise<TranscriptSegment[]> {
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
}

// Singleton para uso em toda a aplicação
export const transcriptionService = new TranscriptionService();

// Exportações para compatibilidade retroativa (se necessário)
export const transcribeVideo = (title: string, duration?: number) => transcriptionService.transcribe(title, duration);
export const translateTranscript = (segments: TranscriptSegment[]) => transcriptionService.translate(segments);
