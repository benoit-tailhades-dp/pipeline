import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Contact } from "@/services/contact-service";

import { ListeContacts } from "../liste-contacts";

function contact(id: number, nom: string, entreprise: string | null = null): Contact {
  return { id, nom, entreprise, creeLe: new Date("2026-11-18T09:00:00.000Z") };
}

describe("ListeContacts", () => {
  it("affiche le nom et l'entreprise d'un contact", () => {
    render(<ListeContacts contacts={[contact(1, "Claire Vasseur", "Ateliers Vernier")]} />);

    const element = screen.getByRole("listitem");
    within(element).getByText("Claire Vasseur");
    within(element).getByText("Ateliers Vernier");
  });

  it("affiche uniquement le nom d'un contact sans entreprise", () => {
    render(<ListeContacts contacts={[contact(1, "Claire Vasseur")]} />);

    expect(screen.getByRole("listitem").textContent).toBe("Claire Vasseur");
  });

  it("affiche les contacts dans l'ordre reçu", () => {
    render(
      <ListeContacts
        contacts={[contact(3, "Inès Garnier"), contact(2, "Marc Delorme"), contact(1, "Claire Vasseur")]}
      />,
    );

    const noms = screen.getAllByRole("listitem").map((element) => element.textContent);
    expect(noms).toEqual(["Inès Garnier", "Marc Delorme", "Claire Vasseur"]);
  });

  it("invite à ajouter un premier contact quand la liste est vide", () => {
    render(<ListeContacts contacts={[]} />);

    screen.getByText(
      "Aucun contact pour l’instant. Ajoutez votre premier contact avec le formulaire ci-dessus.",
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
