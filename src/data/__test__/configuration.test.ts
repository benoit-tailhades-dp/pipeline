import { describe, expect, it } from "vitest";

import { decrireBase, lireConfiguration } from "../configuration";

const TURSO = "libsql://pipeline-moi.turso.io";

describe("lireConfiguration", () => {
  it("utilise le fichier SQLite local.db hors production quand DATABASE_URL manque", () => {
    expect(lireConfiguration({ NODE_ENV: "development" })).toEqual({ url: "file:local.db" });
    expect(lireConfiguration({ NODE_ENV: "development", DATABASE_URL: "  " })).toEqual({
      url: "file:local.db",
    });
  });

  it("refuse de démarrer en production sans DATABASE_URL", () => {
    expect(() => lireConfiguration({ NODE_ENV: "production" })).toThrow(
      "DATABASE_URL manquant : un fichier SQLite local ne persiste pas sur Vercel.",
    );
  });

  it("se connecte à Turso avec l'URL et le jeton", () => {
    expect(
      lireConfiguration({ NODE_ENV: "production", DATABASE_URL: TURSO, DATABASE_AUTH_TOKEN: "jeton" }),
    ).toEqual({ url: TURSO, authToken: "jeton" });
  });

  it("retire les espaces autour des valeurs, souvent collés avec elles", () => {
    expect(
      lireConfiguration({ DATABASE_URL: ` ${TURSO}\n`, DATABASE_AUTH_TOKEN: " jeton " }),
    ).toEqual({ url: TURSO, authToken: "jeton" });
  });

  it.each([TURSO, "https://pipeline-moi.turso.io", "wss://pipeline-moi.turso.io"])(
    "refuse la base distante %s sans jeton",
    (url) => {
      expect(() => lireConfiguration({ DATABASE_URL: url })).toThrow(
        "DATABASE_AUTH_TOKEN manquant : Turso refuse une connexion sans jeton.",
      );
    },
  );

  it.each(["http://127.0.0.1:8080", "http://localhost:8080"])(
    "accepte sans jeton le serveur libSQL local %s",
    (url) => {
      expect(lireConfiguration({ DATABASE_URL: url })).toEqual({ url });
    },
  );

  it("n'envoie pas de jeton à un fichier SQLite", () => {
    expect(
      lireConfiguration({ DATABASE_URL: "file:local.db", DATABASE_AUTH_TOKEN: "jeton" }),
    ).toEqual({ url: "file:local.db" });
  });
});

describe("decrireBase", () => {
  it("décrit une base Turso sans révéler le jeton", () => {
    const description = decrireBase({ url: TURSO, authToken: "jeton-secret" });

    expect(description).toBe(`${TURSO} (base distante, avec jeton)`);
    expect(description).not.toContain("jeton-secret");
  });

  it("décrit un fichier SQLite local", () => {
    expect(decrireBase({ url: "file:local.db" })).toBe("file:local.db (fichier SQLite local)");
  });
});
