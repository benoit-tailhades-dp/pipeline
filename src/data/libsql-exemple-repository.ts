import type { Db } from "./db";
import type { ExempleRepository } from "./exemple-repository";

export function createLibsqlExempleRepository(db: Db): ExempleRepository {
  return {
    async ping() {
      try {
        const result = await db.execute("SELECT 1 AS ok");
        return result.rows[0]?.ok === 1;
      } catch {
        return false;
      }
    },
  };
}
