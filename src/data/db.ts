import { createClient, type Client } from "@libsql/client";

export type Db = Client;

/**
 * Seul point d'entrée vers le client SQL.
 * `file:local.db` (SQLite local), `:memory:` (tests) ou `libsql://…` (Turso, avec authToken).
 */
export function createDb(url: string, authToken?: string): Db {
  return createClient({ url, authToken });
}
