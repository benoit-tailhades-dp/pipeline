/**
 * Où se trouve la base, lu dans l'environnement :
 * - `DATABASE_URL` : `file:local.db` (SQLite local) ou `libsql://…` (Turso) ;
 * - `DATABASE_AUTH_TOKEN` : le jeton Turso, obligatoire pour une base distante.
 * Passer de SQLite à Turso ne change que ces deux variables.
 */
export interface ConfigurationBase {
  url: string;
  authToken?: string;
}

/** Base par défaut hors production : un fichier SQLite à la racine du projet. */
const BASE_LOCALE = "file:local.db";

const HOTES_LOCAUX = new Set(["localhost", "127.0.0.1", "[::1]"]);

function estUnFichier(url: string): boolean {
  return url.startsWith("file:") || url === ":memory:";
}

/** Un serveur libSQL sur la machine (`turso dev`, sqld) ne demande pas de jeton. */
function estSurLaMachine(url: string): boolean {
  try {
    return HOTES_LOCAUX.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function lireConfiguration(env: Record<string, string | undefined>): ConfigurationBase {
  const url = env.DATABASE_URL?.trim();
  const jeton = env.DATABASE_AUTH_TOKEN?.trim();

  if (!url) {
    if (env.NODE_ENV === "production") {
      throw new Error("DATABASE_URL manquant : un fichier SQLite local ne persiste pas sur Vercel.");
    }
    return { url: BASE_LOCALE };
  }
  if (estUnFichier(url)) return { url };
  if (jeton) return { url, authToken: jeton };
  if (estSurLaMachine(url)) return { url };
  throw new Error("DATABASE_AUTH_TOKEN manquant : Turso refuse une connexion sans jeton.");
}

/** Pour les messages : l'adresse de la base, jamais son jeton. */
export function decrireBase({ url, authToken }: ConfigurationBase): string {
  if (estUnFichier(url)) return `${url} (fichier SQLite local)`;
  return authToken ? `${url} (base distante, avec jeton)` : `${url} (serveur libSQL local, sans jeton)`;
}
