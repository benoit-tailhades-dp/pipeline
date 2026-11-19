import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarreApp } from "../barre-app";

describe("BarreApp", () => {
  it("affiche le nombre de relances dues sur l'onglet « Aujourd’hui »", () => {
    render(<BarreApp actif="tableau" relancesDues={4} />);

    const onglet = screen.getByRole("link", { name: /Aujourd’hui/ });
    expect(onglet.textContent).toBe("Aujourd’hui4 relances dues");
  });

  it("n'affiche pas de compteur sans relance due, ni pendant le chargement", () => {
    const { rerender } = render(<BarreApp actif="tableau" relancesDues={0} />);
    expect(screen.getByRole("link", { name: /Aujourd’hui/ }).textContent).toBe("Aujourd’hui");

    rerender(<BarreApp actif="tableau" relancesDues={null} />);
    expect(screen.getByRole("link", { name: /Aujourd’hui/ }).textContent).toBe("Aujourd’hui");
  });

  it("signale la vue courante", () => {
    const { rerender } = render(<BarreApp actif="tableau" relancesDues={0} />);
    expect(screen.getByRole("link", { name: "Tableau" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Aujourd’hui/ }).getAttribute("aria-current")).toBeNull();

    rerender(<BarreApp actif="aujourdhui" relancesDues={0} />);
    expect(screen.getByRole("link", { name: /Aujourd’hui/ }).getAttribute("aria-current")).toBe("page");
  });

  it("mène au tableau et à la page du jour", () => {
    render(<BarreApp actif="tableau" relancesDues={0} />);

    expect(screen.getByRole("link", { name: "Tableau" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: /Aujourd’hui/ }).getAttribute("href")).toBe("/aujourdhui");
  });
});
