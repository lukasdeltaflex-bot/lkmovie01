export type Platform = "tiktok" | "reels" | "shorts" | "youtube";
export type ViralTemplate = "motivacional" | "triste" | "impacto" | "reflexivo" | "cinematográfico" | "curiosidade";

export interface AutoProjectFlavor {
  query: string;
  caption: string;
  captionEn: string;
  platform: Platform;
  template: ViralTemplate;
  editorPreset: string;
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

const VIRAL_HOOKS: Record<ViralTemplate, {pt: string, en: string}[]> = {
  motivacional: [
    { pt: "O SEGREDO QUE NINGUÉM TE CONTA 🤫", en: "THE SECRET NO ONE TELLS YOU 🤫" },
    { pt: "LEIA ISSO SE VOCÊ QUER VENCER 🏆", en: "READ THIS IF YOU WANT TO WIN 🏆" },
    { pt: "SÓ O QUE REALMENTE IMPORTA...", en: "ALL THAT TRULY MATTERS..." },
    { pt: "ISSO VAI MUDAR SEU DIA ⚡", en: "THIS WILL CHANGE YOUR DAY ⚡" }
  ],
  triste: [
    { pt: "VOCÊ JÁ SENTIU ISSO? 💔", en: "HAVE YOU EVER FELT THIS? 💔" },
    { pt: "UM MOMENTO DE REFLEXÃO 🕯️", en: "A MOMENT OF REFLECTION 🕯️" },
    { pt: "A DOR QUE NOS ENSINA 🌊", en: "THE PAIN THAT TEACHES US 🌊" },
    { pt: "TEMPOS DIFÍCEIS... ⛈️", en: "HARD TIMES... ⛈️" }
  ],
  impacto: [
    { pt: "PARE TUDO O QUE ESTÁ FAZENDO! 🛑", en: "STOP EVERYTHING YOU'RE DOING! 🛑" },
    { pt: "VOCÊ PRECISA VER ISSO 👁️", en: "YOU NEED TO SEE THIS 👁️" },
    { pt: "O IMPACTO É REAL 🌋", en: "THE IMPACT IS REAL 🌋" },
    { pt: "NÃO IGNORE ESTE VÍDEO ⚠️", en: "DO NOT IGNORE THIS VIDEO ⚠️" }
  ],
  reflexivo: [
    { pt: "A VERDADE POR TRÁS DE TUDO 🌿", en: "THE TRUTH BEHIND EVERYTHING 🌿" },
    { pt: "UMA LIÇÃO PARA A VIDA 📖", en: "A LESSON FOR LIFE 📖" },
    { pt: "PENSE NISSO POR UM SEGUNDO 🤔", en: "THINK ABOUT THIS FOR A SECOND 🤔" },
    { pt: "O MUNDO ESTÁ MUDANDO... ✨", en: "THE WORLD IS CHANGING... ✨" }
  ],
  cinematográfico: [
    { pt: "MOMENTOS ÉPICOS 🎥", en: "EPIC MOMENTS 🎥" },
    { pt: "A ARTE DO CINEMA 🍿", en: "THE ART OF CINEMA 🍿" },
    { pt: "VISUAIS DE OUTRO MUNDO 🪐", en: "OUT OF THIS WORLD VISUALS 🪐" },
    { pt: "EXPERIÊNCIA CINEMATOGRÁFICA 💎", en: "CINEMATIC EXPERIENCE 💎" }
  ],
  curiosidade: [
    { pt: "VOCÊ SABIA DISSO? 🧠", en: "DID YOU KNOW THIS? 🧠" },
    { pt: "ALGO QUE VAI TE SURPREENDER 🤯", en: "SOMETHING THAT WILL SURPRISE YOU 🤯" },
    { pt: "O QUE ELES NÃO QUEREM QUE VOCÊ SAIBA... 🤫", en: "WHAT THEY DON'T WANT YOU TO KNOW... 🤫" },
    { pt: "CURIOSIDADES RÁPIDAS ⚡", en: "QUICK FACTS ⚡" }
  ]
};

const TEMPLATE_MODES: Record<ViralTemplate, { preset: string, color: string, pos: "top" | "center" | "bottom" }> = {
  motivacional: { preset: 'tiktok', color: '#ffffff', pos: 'center' },
  triste: { preset: 'clean', color: '#e2e8f0', pos: 'bottom' },
  impacto: { preset: 'mrbeast', color: '#fbbf24', pos: 'center' },
  reflexivo: { preset: 'minimal', color: '#ffffff', pos: 'center' },
  cinematográfico: { preset: 'highContrast', color: '#ffffff', pos: 'bottom' },
  curiosidade: { preset: 'captionBox', color: '#fbbf24', pos: 'center' }
};

export const generateViralHook = (template: ViralTemplate): {pt: string, en: string} => {
  const hooks = VIRAL_HOOKS[template];
  return hooks[Math.floor(Math.random() * hooks.length)];
};

/**
 * Inteligência Artificial Viral Hub - LKMOVIE PRO
 */
export const generateAutoProject = (
  idea: string, 
  platform: Platform = "tiktok",
  template: ViralTemplate = "motivacional"
): AutoProjectFlavor => {
  const hook = generateViralHook(template);
  const isVertical = platform !== "youtube";
  
  const simulateTranslation = (text: string): string => {
    // Heurística Pro: Mapeamento de termos comuns para o nicho de vídeos virais
    const dictionary: Record<string, string> = {
      "resiliência": "resilience",
      "academia": "gym",
      "sucesso": "success",
      "dinheiro": "money",
      "foco": "focus",
      "estudar": "study",
      "trabalho": "work",
      "amor": "love",
      "tristeza": "sadness",
      "natureza": "nature",
      "vida": "life",
      "dia": "day",
      "noite": "night",
      "sonhos": "dreams",
      "medo": "fear",
      "coragem": "courage",
      "vencer": "win",
      "perder": "lose",
      "disciplina": "discipline",
      "motivação": "motivation"
    };

    let translated = text.toLowerCase();
    Object.entries(dictionary).forEach(([pt, en]) => {
      translated = translated.replace(new RegExp(pt, 'g'), en);
    });

    // Se não mudou quase nada, adiciona um sufixo "Thematic" para o feeling
    if (translated === text.toLowerCase()) {
      return `Insight: ${text}`;
    }

    return translated;
  };

  let query = idea;
  let caption = `${hook.pt}\n${idea}`;
  let captionEn = `${hook.en}\n${simulateTranslation(idea)}`;
  let musicStyle = "Ambient";
  let mix: AutoProjectFlavor["audio"]["mix"] = "mix";

  const mode = TEMPLATE_MODES[template] || TEMPLATE_MODES.motivacional;

  if (template === "motivacional") {
    query = `${idea} epic motivation cinematic 4k short`;
    musicStyle = "Inspirational Orchestral";
  } else if (template === "triste") {
    query = `${idea} emotional sad cinematic scene short`;
    musicStyle = "Sad Piano";
  } else if (template === "impacto") {
    query = `${idea} massive energetic action impact viral`;
    musicStyle = "Aggressive Techno";
    mix = "remove";
  } else if (template === "reflexivo") {
    query = `${idea} contemplative nature calm focus documentary`;
    musicStyle = "LoFi Meditation";
  } else {
    query = `${idea} 4k high quality cinematic aesthetic visual`;
    musicStyle = "Cinematic Soundscape";
  }

  return {
    query,
    caption: caption.toUpperCase(),
    captionEn: captionEn.toUpperCase(),
    platform,
    template,
    editorPreset: mode.preset,
    style: {
      color: mode.color,
      size: isVertical ? 42 : 32,
      position: mode.pos
    },
    audio: {
      musicStyle,
      mix,
      volumeMusic: 0.6
    }
  };
};
