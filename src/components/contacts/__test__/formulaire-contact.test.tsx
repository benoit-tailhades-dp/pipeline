import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormulaireContact, type EtatFormulaireContact } from "../formulaire-contact";

const actionInerte = async (etat: EtatFormulaireContact) => etat;

describe("FormulaireContact", () => {
  it("affiche les champs Nom et Entreprise, sans erreur au départ", () => {
    render(<FormulaireContact action={actionInerte} />);

    const nom = screen.getByLabelText("Nom");
    // Pas de `required` : c'est le service qui valide, pour afficher son message.
    expect(nom.hasAttribute("required")).toBe(false);
    expect(nom.getAttribute("aria-invalid")).toBeNull();
    screen.getByLabelText(/Entreprise/);
    screen.getByRole("button", { name: "Ajouter" });
    expect(screen.queryByText("Indiquez le nom du contact.")).toBeNull();
  });

  it("affiche l'erreur du service sous le champ Nom", () => {
    render(
      <FormulaireContact
        action={actionInerte}
        etatInitial={{ erreurs: { nom: "Indiquez le nom du contact." } }}
      />,
    );

    const nom = screen.getByLabelText("Nom");
    const message = screen.getByText("Indiquez le nom du contact.");
    expect(nom.getAttribute("aria-invalid")).toBe("true");
    expect(nom.getAttribute("aria-describedby")).toBe(message.id);
  });

  it("conserve la saisie renvoyée avec une erreur", () => {
    render(
      <FormulaireContact
        action={actionInerte}
        etatInitial={{
          erreurs: { nom: "Indiquez le nom du contact." },
          valeurs: { nom: "  ", entreprise: "Ateliers Vernier" },
        }}
      />,
    );

    expect((screen.getByLabelText(/Entreprise/) as HTMLInputElement).value).toBe(
      "Ateliers Vernier",
    );
  });

  it("affiche l'erreur du service sous le champ Entreprise", () => {
    const message = "L'entreprise ne doit pas dépasser 200 caractères.";
    render(
      <FormulaireContact action={actionInerte} etatInitial={{ erreurs: { entreprise: message } }} />,
    );

    const entreprise = screen.getByLabelText(/Entreprise/);
    const erreur = screen.getByText(message);
    expect(entreprise.getAttribute("aria-invalid")).toBe("true");
    expect(entreprise.getAttribute("aria-describedby")).toBe(erreur.id);
  });
});
