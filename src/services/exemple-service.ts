import type { ExempleRepository } from "@/data/exemple-repository";

export type EtatBase = "ok" | "indisponible";

export function createExempleService(repository: ExempleRepository) {
  return {
    async statut(): Promise<EtatBase> {
      return (await repository.ping()) ? "ok" : "indisponible";
    },
  };
}

export type ExempleService = ReturnType<typeof createExempleService>;
