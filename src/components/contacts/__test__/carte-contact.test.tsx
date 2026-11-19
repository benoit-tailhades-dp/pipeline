import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactSuivi } from "@/services/contact-service";

import { CarteContact, type ActionsContact } from "../carte-contact";
import { actionsInertes, contactSuivi, etapes } from "./fixtures";

const nouveau = contactSuivi();

const enDemo = contactSuivi({
  etape: "demo",
  temperature: "tiede",
  position: 3,
  suivante: "proposition",
});

const enProposition = contactSuivi({
  etape: "proposition",
  temperature: "chaud",
  position: 4,
  suivante: "gagne",
});

const gagne = contactSuivi({ etape: "gagne", temperature: "signe", position: 5, suivante: null });

function afficher(contact: ContactSuivi, actions: Partial<ActionsContact> = {}) {
  return render(
    <CarteContact contact={contact} etapes={etapes} actions={{ ...actionsInertes, ...actions }} />,
  );
}

function menuEtape() {
  return screen.getByRole("combobox", { name: "Étape" });
}

/** Valeur affichée dans le menu, sans le chevron. */
function etapeAffichee() {
  return menuEtape().querySelector("[data-slot=select-value]")?.textContent;
}

describe("CarteContact", () => {
  it("affiche le nom et l'entreprise du contact", () => {
    afficher(nouveau);

    screen.getByRole("heading", { name: "Claire Vasseur" });
    screen.getByText("Ateliers Vernier");
  });

  it("affiche un nouveau contact à « À contacter », avec la pastille Froid", () => {
    afficher(nouveau);

    expect(etapeAffichee()).toBe("À contacter");
    screen.getByText("Froid");
    screen.getByRole("img", { name: "Étape 1 sur 5" });
  });

  it("affiche un contact en démo avec la pastille Tiède et la piste à 3 sur 5", () => {
    afficher(enDemo);

    expect(etapeAffichee()).toBe("Démo planifiée");
    screen.getByText("Tiède");
    screen.getByRole("img", { name: "Étape 3 sur 5" });
  });

  it("affiche la pastille Chaud pour une proposition, Signé pour un contact gagné", () => {
    const { unmount } = afficher(enProposition);
    screen.getByText("Chaud");
    unmount();

    afficher(gagne);
    screen.getByText("Signé");
  });

  it("colore la piste jusqu'à l'étape courante", () => {
    afficher(enDemo);

    const piste = screen.getByRole("img", { name: "Étape 3 sur 5" });
    const segments = Array.from(piste.children) as HTMLElement[];
    expect(segments.map((segment) => segment.dataset.franchie)).toEqual([
      "true",
      "true",
      "true",
      "false",
      "false",
    ]);
  });

  it("transmet l'identifiant du contact quand je clique sur « Étape suivante »", () => {
    const avancer = vi.fn(async () => {});
    afficher(enDemo, { avancer });

    fireEvent.click(screen.getByRole("button", { name: "Étape suivante" }));

    expect(avancer).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("ne propose pas « Étape suivante » pour un contact « Gagné »", () => {
    afficher(gagne);

    expect(screen.queryByRole("button", { name: "Étape suivante" })).toBeNull();
    // L'étape reste corrigeable depuis la liste.
    expect(etapeAffichee()).toBe("Gagné");
  });

  it("transmet l'étape choisie dans la liste des étapes", async () => {
    const changerEtape = vi.fn(async () => {});
    afficher(enProposition, { changerEtape });

    expect(etapeAffichee()).toBe("Proposition envoyée");
    fireEvent.click(menuEtape());
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "À contacter",
      "Premier échange",
      "Démo planifiée",
      "Proposition envoyée",
      "Gagné",
    ]);
    // Base UI ne valide un clic de souris que s'il commence sur l'option, comme dans un navigateur.
    const premierEchange = screen.getByRole("option", { name: "Premier échange" });
    fireEvent.pointerDown(premierEchange, { pointerType: "mouse" });
    fireEvent.click(premierEchange);

    expect(changerEtape).toHaveBeenCalledExactlyOnceWith(7, "premier-echange");
  });

  it("affiche la relance planifiée", () => {
    afficher(contactSuivi({ relanceLe: "2026-11-24" }));

    screen.getByText("Relance le 24 nov.");
  });

  it("affiche « Dernier échange : aujourd’hui » pour un échange du jour", () => {
    afficher(contactSuivi({ dernierEchangeLe: "2026-11-18", joursDepuisDernierEchange: 0 }));

    screen.getByText("Dernier échange : aujourd’hui");
  });

  it("affiche « hier », puis la date, pour un échange plus ancien", () => {
    const { unmount } = afficher(
      contactSuivi({ dernierEchangeLe: "2026-11-17", joursDepuisDernierEchange: 1 }),
    );
    screen.getByText("Dernier échange : hier");
    unmount();

    afficher(contactSuivi({ dernierEchangeLe: "2026-11-04", joursDepuisDernierEchange: 14 }));
    screen.getByText("Dernier échange : le 4 nov.");
  });

  it("n'affiche pas de dernier échange quand il n'y en a pas eu", () => {
    afficher(contactSuivi());

    expect(screen.queryByText(/Dernier échange/)).toBeNull();
  });

  it("affiche la note du dernier échange", () => {
    afficher(contactSuivi({ note: "Rappeler après l'audit de juin" }));

    screen.getByText("Rappeler après l'audit de juin");
  });

  it("affiche la fonction, l'e-mail et le téléphone", () => {
    afficher(
      contactSuivi({
        fonction: "Responsable PLM",
        email: "claire.vasseur@vernier.fr",
        telephone: "06 12 34 56 78",
      }),
    );

    screen.getByText("Responsable PLM, Ateliers Vernier");
    screen.getByText("claire.vasseur@vernier.fr");
    screen.getByText("06 12 34 56 78");
  });

  it("ouvre la fiche pré-remplie quand je clique sur « Modifier »", () => {
    afficher(contactSuivi());

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect((screen.getByLabelText("Nom") as HTMLInputElement).value).toBe("Claire Vasseur");
    expect((screen.getByLabelText(/Entreprise/) as HTMLInputElement).value).toBe(
      "Ateliers Vernier",
    );
  });

  it("referme la fiche sans rien transmettre quand j'annule la modification", () => {
    const modifier = vi.fn(async () => ({}));
    afficher(contactSuivi(), { modifier });

    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByLabelText("Nom")).toBeNull();
    expect(modifier).not.toHaveBeenCalled();
  });

  it("supprime le contact après confirmation", () => {
    const supprimer = vi.fn(async () => {});
    afficher(contactSuivi(), { supprimer });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(supprimer).not.toHaveBeenCalled();
    screen.getByText("Supprimer Claire Vasseur ? Cette action est définitive.");
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la suppression" }));

    expect(supprimer).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("ne change rien quand j'annule la suppression", () => {
    const supprimer = vi.fn(async () => {});
    afficher(contactSuivi(), { supprimer });

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(supprimer).not.toHaveBeenCalled();
    expect(screen.queryByText(/Cette action est définitive/)).toBeNull();
    screen.getByRole("heading", { name: "Claire Vasseur" });
    screen.getByRole("button", { name: "Supprimer" });
  });
});
