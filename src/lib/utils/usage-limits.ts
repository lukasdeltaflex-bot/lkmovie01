import { UserSettings } from "@/types/project.d";

export const PLAN_LIMITS = {
  free: {
    maxDailySearches: 10,
    maxProjects: 5,
    maxRenders: 3,
  },
  pro: {
    maxDailySearches: 1000,
    maxProjects: 1000,
    maxRenders: 1000,
  }
};

type ActionType = "search" | "project" | "render";

/**
 * Verifica se o usuário tem saldo para realizar uma ação
 */
export const canPerformAction = (settings: UserSettings, action: ActionType): { allowed: boolean; message?: string } => {
  const plan = settings.plan || "free";
  const limits = PLAN_LIMITS[plan];
  const usage = settings.usage || { searchesCount: 0, projectsCount: 0, rendersCount: 0 };

  if (action === "search") {
    if (usage.searchesCount >= limits.maxDailySearches) {
      return { 
        allowed: false, 
        message: "Limite de buscas diárias atingido no plano Free. Faça upgrade para Pro para buscas ilimitadas." 
      };
    }
  }

  if (action === "project") {
    if (usage.projectsCount >= limits.maxProjects) {
      return { 
        allowed: false, 
        message: "Você atingiu o limite de 5 projetos. Exclua projetos antigos ou mude para o plano Pro." 
      };
    }
  }

  if (action === "render") {
    if (usage.rendersCount >= limits.maxRenders) {
      return { 
        allowed: false, 
        message: "Limite de renderizações atingido. Assine o plano Pro para renderizar vídeos ilimitados." 
      };
    }
  }

  return { allowed: true };
};
