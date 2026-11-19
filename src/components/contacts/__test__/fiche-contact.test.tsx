import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FicheContact, type EtatFiche, type ValeursFiche } from "../fiche-contact";
import { contactSuivi } from "./fixtures";

function afficher(
  modifier: (id: number, valeurs: ValeursFiche) => Promise<EtatFiche>,
  rappels: { onEnregistre?: () => void; onAnnule?: () => void } = {},
) {
  return render(
    <FicheContact
      contact={contactSuivi({ fonction: "Responsable PLM" })}
      modifierAction={modifier}
      onEnregistre={rappels.onEnregistre ?? (() => {})}
      onAnnule={rappels.onAnnule ?? (() => {})}
    />,
  );
}

function champ(libelle: RegExp | string) {
  return screen.getByLabelText(libelle) as HTMLInputElement;
}

function enregistrer() {
  fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
}

const valeursInitiales: ValeursFiche = {
  nom: "Claire Vasseur",
  entreprise: "Ateliers Vernier",
  fonction: "Responsable PLM",
  email: "",
  telephone: "",
};

describe("FicheContact", () => {
  it("pré-remplit nom, entreprise, fonction, e-mail et téléphone", () => {
    afficher(async () => ({}));

    expect(champ("Nom").value).toBe("Claire Vasseur");
    expect(champ(/Entreprise/).value).toBe("Ateliers Vernier");
    expect(champ(/Fonction/).value).toBe("Responsable PLM");
    expect(champ(/E-mail/).value).toBe("");
    expect(champ(/Téléphone/).value).toBe("");
  });

  it("transmet la nouvelle entreprise, puis se referme une fois enregistrée", async () => {
    const modifier = vi.fn(async () => ({}));
    const onEnregistre = vi.fn();
    afficher(modifier, { onEnregistre });

    fireEvent.change(champ(/Entreprise/), { target: { value: "Vernier Industrie" } });
    enregistrer();

    await waitFor(() => expect(onEnregistre).toHaveBeenCalledOnce());
    expect(modifier).toHaveBeenCalledExactlyOnceWith(7, {
      ...valeursInitiales,
      entreprise: "Vernier Industrie",
    });
  });

  it("affiche le refus du nom vide et reste ouverte", async () => {
    const message = "Indiquez le nom du contact.";
    const onEnregistre = vi.fn();
    afficher(async (_id, valeurs) => ({ erreurs: { nom: message }, valeurs }), { onEnregistre });

    fireEvent.change(champ("Nom"), { target: { value: "" } });
    enregistrer();

    const erreur = await screen.findByText(message);
    expect(champ("Nom").getAttribute("aria-invalid")).toBe("true");
    expect(champ("Nom").getAttribute("aria-describedby")).toBe(erreur.id);
    expect(onEnregistre).not.toHaveBeenCalled();
  });

  it("affiche le refus d'un e-mail mal formé, sans perdre la saisie", async () => {
    const message = "Cette adresse e-mail n'est pas valide.";
    afficher(async (_id, valeurs) => ({ erreurs: { email: message }, valeurs }));

    fireEvent.change(champ(/E-mail/), { target: { value: "claire@vernier" } });
    enregistrer();

    const erreur = await screen.findByText(message);
    expect(champ(/E-mail/).getAttribute("aria-invalid")).toBe("true");
    expect(champ(/E-mail/).getAttribute("aria-describedby")).toBe(erreur.id);
    expect(champ(/E-mail/).value).toBe("claire@vernier");
  });

  it("prévient l'appel quand j'annule", () => {
    const onAnnule = vi.fn();
    afficher(async () => ({}), { onAnnule });

    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onAnnule).toHaveBeenCalledOnce();
  });
});
