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
});
