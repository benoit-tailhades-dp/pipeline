import { describe, expect, it } from "vitest";

import type { ExempleRepository } from "@/data/exemple-repository";

import { createExempleService } from "./exemple-service";

describe("ExempleService", () => {
  it("renvoie « ok » quand la base répond", async () => {
    const repository: ExempleRepository = { ping: async () => true };

    await expect(createExempleService(repository).statut()).resolves.toBe("ok");
  });
});
