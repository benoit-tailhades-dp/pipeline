import { createClient, type Client, type Row } from "@libsql/client";

export type Db = Client;

/** Ligne brute renvoyée par une requête : à convertir en objet du domaine dans le repository. */
export type Ligne = Row;

/**
 * Seul point d'entrée vers le client SQL.
 * `file:local.db` (SQLite local), `:memory:` (tests) ou `libsql://…` (Turso, avec authToken).
 */
export function createDb(url: string, authToken?: string): Db {
  return createClient({ url, authToken });
}
