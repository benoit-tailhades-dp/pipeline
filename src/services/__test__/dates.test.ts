import { describe, expect, it } from "vitest";

import { dateDuJour, estUneDate } from "../dates";

describe("dateDuJour", () => {
  it("donne la date du calendrier dans le fuseau", () => {
    expect(dateDuJour(new Date("2026-11-18T09:00:00.000Z"), "Europe/Paris")).toBe("2026-11-18");
  });

  it("passe au lendemain à minuit dans le fuseau, pas à minuit UTC", () => {
    // 23 h 30 UTC le 18, soit 0 h 30 le 19 à Paris.
    expect(dateDuJour(new Date("2026-11-18T23:30:00.000Z"), "Europe/Paris")).toBe("2026-11-19");
  });
});

describe("estUneDate", () => {
  it.each(["2026-11-24", "2028-02-29"])("accepte %j", (valeur) => {
    expect(estUneDate(valeur)).toBe(true);
  });

  it.each(["", "demain", "24/11/2026", "2026-2-4", "2026-02-30", "2026-13-01", "2026-11-24T00:00"])(
    "refuse %j",
    (valeur) => {
      expect(estUneDate(valeur)).toBe(false);
    },
  );
});
