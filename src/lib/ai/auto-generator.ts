export type Platform = "tiktok" | "reels" | "shorts" | "youtube";
export type ViralTemplate = "motivacional" | "triste" | "impacto" | "reflexivo" | "cinematográfico";

export interface AutoProjectFlavor {
  query: string;
  caption: string;
  platform: Platform;
  template: ViralTemplate;
  style: {
    color: string;
    size: number;
    position: "top" | "center" | "bottom";
  };
  audio: {
    musicStyle: string;
    mix: "keep" | "remove" | "mix";
    volumeMusic: number;
  };
}

const VIRAL_HOOKS: Record<ViralTemplate, string[]> = {
  motivacional: [
    "O SEGREDO QUE NINGUÉM TE CONTA 🤫", 
    "LEIA ISSO SE VOCÊ QUER VENCER 🏆", 
    "SÓ O QUE REALMENTE IMPORTA...",
    "ISSO VAI MUDAR SEU DIA ⚡"
  ],
  triste: [
    "VOCÊ JÁ SENTIU ISSO? 💔",
    "Ás vezes, tudo o que precisamos é...",
    "UM MOMENTO DE REFLEXÃO 🕯️",
    "A DOR QUE NOS ENSINA 🌊"
  ],
  impacto: [
    "PARE TUDO O QUE ESTÁ FAZENDO! 🛑",
    "ISSO É REALMENTE ASSUSTADOR... 🎥",
    "O IMPACTO É REAL 🌋",
    "VOCÊ PRECISA VER ISSO 👁️"
  ],
  reflexivo: [
    "O PENSAMENTO DO DIA... 🤔",
    "A VERDADE POR TRÁS DE TUDO 🌿",
    "SERÁ QUE ESTAMOS CERTOS? ✨",
    "UMA LIÇÃO PARA A VIDA 📖"
  ],
  cinematográfico: [
    "CINE: MOMENTOS ÉPICOS 🎥",
    "A ARTE DO CINEMA 🍿",
    "VISUAIS DE OUTRO MUNDO 🪐",
    "EXPERIÊNCIA CINEMATOGRÁFICA 💎"
  ]
};

const TEMPLATE_STYLES: Record<ViralTemplate, Partial<AutoProjectFlavor["style"]>> = {
  motivacional: { color: "#ffffff", size: 32 },
  triste: { color: "#e2e8f0", size: 28 },
  impacto: { color: "#fbbf24", size: 40 },
  reflexivo: { color: "#ffffff", size: 30 },
  cinematográfico: { color: "#ffffff", size: 26 }
};

export const generateViralHook = (template: ViralTemplate): string => {
  const hooks = VIRAL_HOOKS[template];
  return hooks[Math.floor(Math.random() * hooks.length)];
};

/**
 * Inteligência Artificial (Simulada) para LKMOVIE - Fase 10 (Viral Hub)
 */
export const generateAutoProject = (
  idea: string, 
  platform: Platform = "tiktok",
  template: ViralTemplate = "motivacional"
): AutoProjectFlavor => {
  const input = idea.toLowerCase();
  const hook = generateViralHook(template);
  
  const isVertical = platform !== "youtube";
  const defaultPosition = isVertical ? "center" : "bottom";

  let query = idea;
  let caption = `${hook}\n${idea}`;
  let musicStyle = "Ambient";
  let mix: AutoProjectFlavor["audio"]["mix"] = "mix";

  // Estilos Base por Template
  const baseStyle = {
    ...TEMPLATE_STYLES[template],
    position: (isVertical && template === "impacto") ? "top" : defaultPosition
  } as AutoProjectFlavor["style"];

  if (template === "motivacional") {
    query = `${idea} epic motivation cinematic 4k`;
    musicStyle = "Inspirational Orchestral";
  } else if (template === "triste") {
    query = `${idea} emotional sad cinematic scene`;
    musicStyle = "Sad Piano";
  } else if (template === "impacto") {
    query = `${idea} massive energetic action impact`;
    musicStyle = "Aggressive Techno";
    mix = "remove";
  } else if (template === "reflexivo") {
    query = `${idea} contemplative nature calm focus`;
    musicStyle = "LoFi Meditation";
  } else {
    query = `${idea} 4k high quality cinematic visual`;
    musicStyle = "Cinematic Soundscape";
  }

  return {
    query,
    caption: caption.toUpperCase(),
    platform,
    template,
    style: baseStyle,
    audio: {
      musicStyle,
      mix,
      volumeMusic: 0.6
    }
  };
};
