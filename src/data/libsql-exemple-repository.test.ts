import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDb, type Db } from "./db";
import { createLibsqlExempleRepository } from "./libsql-exemple-repository";

describe("LibsqlExempleRepository", () => {
  let db: Db;

  beforeEach(() => {
    db = createDb(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  it("répond au ping sur une base SQLite", async () => {
    const repository = createLibsqlExempleRepository(db);

    await expect(repository.ping()).resolves.toBe(true);
  });
});
