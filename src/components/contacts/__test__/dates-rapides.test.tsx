import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatesRapides } from "../dates-rapides";
import { datesRapides } from "./fixtures";

describe("DatesRapides", () => {
  it("propose les quatre dates avec leur jour", () => {
    render(<DatesRapides dates={datesRapides} onChoisir={() => {}} />);

    const boutons = screen.getByRole("group", { name: "Dates rapides" }).querySelectorAll("button");
    expect(Array.from(boutons, (bouton) => bouton.textContent)).toEqual([
      "Demainjeu. 19 nov.",
      "Dans 3 jourssam. 21 nov.",
      "Dans 1 semainemer. 25 nov.",
      "Dans 2 semainesmer. 2 déc.",
    ]);
  });

  it("transmet la date choisie", () => {
    const onChoisir = vi.fn();
    render(<DatesRapides dates={datesRapides} onChoisir={onChoisir} />);

    fireEvent.click(screen.getByRole("button", { name: /^Dans 2 semaines/ }));

    expect(onChoisir).toHaveBeenCalledExactlyOnceWith("2026-12-02");
  });

  it("signale la date retenue quand il y en a une", () => {
    render(<DatesRapides dates={datesRapides} choisie="2026-11-21" onChoisir={() => {}} />);

    expect(screen.getByRole("button", { name: /^Dans 3 jours/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /^Demain/ }).getAttribute("aria-pressed")).toBe("false");
  });
});
