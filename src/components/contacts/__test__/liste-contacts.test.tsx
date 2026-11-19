import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ContactSuivi, EtapeDuParcours } from "@/services/contact-service";

import { ListeContacts } from "../liste-contacts";

const etapes: EtapeDuParcours[] = [
  { code: "a-contacter", temperature: "froid" },
  { code: "premier-echange", temperature: "froid" },
  { code: "demo", temperature: "tiede" },
  { code: "proposition", temperature: "chaud" },
  { code: "gagne", temperature: "signe" },
];

function contact(id: number, nom: string, entreprise: string | null = null): ContactSuivi {
  return {
    id,
    nom,
    entreprise,
    creeLe: new Date("2026-11-18T09:00:00.000Z"),
    etape: "a-contacter",
    temperature: "froid",
    position: 1,
    suivante: "premier-echange",
  };
}

function afficher(contacts: ContactSuivi[]) {
  return render(
    <ListeContacts
      contacts={contacts}
      etapes={etapes}
      avancerAction={async () => {}}
      changerEtapeAction={async () => {}}
    />,
  );
}

describe("ListeContacts", () => {
  it("affiche le nom et l'entreprise d'un contact", () => {
    afficher([contact(1, "Claire Vasseur", "Ateliers Vernier")]);

    const element = screen.getByRole("listitem");
    within(element).getByRole("heading", { name: "Claire Vasseur" });
    within(element).getByText("Ateliers Vernier");
  });

  it("n'affiche pas d'entreprise pour un contact qui n'en a pas", () => {
    afficher([contact(1, "Claire Vasseur")]);

    const element = screen.getByRole("listitem");
    within(element).getByRole("heading", { name: "Claire Vasseur" });
    expect(element.querySelector("[data-slot=card-description]")).toBeNull();
  });

  it("affiche les contacts dans l'ordre reçu", () => {
    afficher([contact(3, "Inès Garnier"), contact(2, "Marc Delorme"), contact(1, "Claire Vasseur")]);

    const noms = screen
      .getAllByRole("listitem")
      .map((element) => within(element).getByRole("heading").textContent);
    expect(noms).toEqual(["Inès Garnier", "Marc Delorme", "Claire Vasseur"]);
  });

  it("affiche l'étape de chaque contact", () => {
    afficher([contact(1, "Claire Vasseur")]);

    within(screen.getByRole("listitem")).getByRole("combobox", { name: "Étape" });
  });

  it("invite à ajouter un premier contact quand la liste est vide", () => {
    afficher([]);

    screen.getByText(
      "Aucun contact pour l’instant. Ajoutez votre premier contact avec le formulaire ci-dessus.",
    );
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
