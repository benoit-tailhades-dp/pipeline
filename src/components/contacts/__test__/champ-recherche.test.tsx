import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const { ChampRecherche } = await import("../champ-recherche");

describe("ChampRecherche", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("met la recherche dans l'adresse à chaque frappe, pour que le service filtre le tableau", async () => {
    render(<ChampRecherche valeur="" />);

    await act(async () => {
      fireEvent.change(screen.getByRole("searchbox", { name: "Rechercher un contact" }), {
        target: { value: "vernier" },
      });
    });

    expect(replace).toHaveBeenLastCalledWith("/?q=vernier", { scroll: false });
  });

  it("revient au tableau complet quand je vide la recherche", async () => {
    render(<ChampRecherche valeur="vernier" />);
    const champ = screen.getByRole("searchbox", { name: "Rechercher un contact" }) as HTMLInputElement;
    expect(champ.value).toBe("vernier");

    await act(async () => {
      fireEvent.change(champ, { target: { value: "  " } });
    });

    expect(replace).toHaveBeenLastCalledWith("/", { scroll: false });
  });

  it("encode les caractères spéciaux", async () => {
    render(<ChampRecherche valeur="" />);

    await act(async () => {
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Élodie & co" } });
    });

    expect(replace).toHaveBeenLastCalledWith("/?q=%C3%89lodie%20%26%20co", { scroll: false });
  });
});
