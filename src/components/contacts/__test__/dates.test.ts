import { describe, expect, it } from "vitest";

import { formaterDateCourte } from "../dates";

describe("formaterDateCourte", () => {
  it.each([
    ["2026-11-24", "24 nov."],
    ["2026-12-02", "2 déc."],
    ["2027-05-04", "4 mai"],
  ])("formate %s en « %s »", (date, attendu) => {
    expect(formaterDateCourte(date)).toBe(attendu);
  });
});
