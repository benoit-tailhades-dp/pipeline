import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactSuivi } from "@/services/contact-service";

import type { ActionsContact } from "../actions-contact";
import { FicheTiroir } from "../fiche-tiroir";
import { actionsInertes, contactSuivi, enDemo, etapes, parTexte } from "./fixtures";

interface Rappels {
  actions?: Partial<ActionsContact>;
  deplacer?: (id: number, etape: string) => void;
  onFerme?: () => void;
}

function afficher(contact: ContactSuivi | null, { actions = {}, deplacer, onFerme }: Rappels = {}) {
  return render(
    <FicheTiroir
      contact={contact}
      etapes={etapes}
      actions={{ ...actionsInertes, ...actions }}
      deplacer={deplacer ?? (() => {})}
      onFerme={onFerme ?? (() => {})}
    />,
  );
}

function fiche() {
  return screen.getByRole("dialog", { name: "Claire Vasseur" });
}

describe("FicheTiroir", () => {
  it("reste fermée sans contact", () => {
    afficher(null);

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("présente le contact : nom, fonction, entreprise, température et étape", () => {
    afficher(enDemo({ fonction: "Responsable PLM" }));

    within(fiche()).getByText("Responsable PLM, Ateliers Vernier");
    within(fiche()).getByText("Tiède");
    within(fiche()).getByText("Étape 3 sur 5");
  });

  it("marque l'étape courante sur la piste", () => {
    afficher(enDemo());

    const piste = within(fiche()).getByRole("group", { name: "Étape" });
    const courante = within(piste)
      .getAllByRole("button")
      .filter((bouton) => bouton.getAttribute("aria-current") === "step")
      .map((bouton) => bouton.textContent);
    expect(courante).toEqual(["Démo planifiée"]);
  });

  it("corrige l'étape quand je choisis une étape sur la piste", () => {
    const deplacer = vi.fn();
    afficher(enDemo(), { deplacer });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Proposition envoyée" }));

    expect(deplacer).toHaveBeenCalledExactlyOnceWith(7, "proposition");
  });

  it("fait passer à l'étape suivante", () => {
    const deplacer = vi.fn();
    afficher(enDemo(), { deplacer });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Passer à « Proposition envoyée »" }));

    expect(deplacer).toHaveBeenCalledExactlyOnceWith(7, "proposition");
  });

  it("ne propose pas d'étape suivante pour un contact gagné", () => {
    afficher(contactSuivi({ etape: "gagne", temperature: "signe", position: 5, suivante: null }));

    within(fiche()).getByText("Signé");
    expect(within(fiche()).queryByRole("button", { name: /Passer à/ })).toBeNull();
  });

  it("affiche la relance planifiée et permet de la retirer", async () => {
    const retirerRelance = vi.fn(async () => {});
    afficher(enDemo({ relanceLe: "2026-11-24", retardRelance: -6 }), { actions: { retirerRelance } });

    within(fiche()).getByText("Relance le 24 nov.");
    await act(async () => {
      fireEvent.click(within(fiche()).getByRole("button", { name: "Retirer la relance" }));
    });

    expect(retirerRelance).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("affiche le dernier échange et sa note", () => {
    afficher(
      enDemo({
        dernierEchangeLe: "2026-11-17",
        joursDepuisDernierEchange: 1,
        note: "Rappeler après l’audit de juin",
      }),
    );

    within(fiche()).getByText(parTexte("Dernier échange : hier"));
    within(fiche()).getByText("Rappeler après l’audit de juin");
  });

  it("indique qu'aucun échange n'a eu lieu", () => {
    afficher(enDemo());

    within(fiche()).getByText("Aucun échange enregistré.");
  });

  it("affiche les coordonnées", () => {
    afficher(
      enDemo({
        fonction: "Responsable PLM",
        email: "c.vasseur@ateliers-vernier.example",
        telephone: "06 12 34 56 78",
      }),
    );

    within(fiche()).getByText("c.vasseur@ateliers-vernier.example");
    within(fiche()).getByText("06 12 34 56 78");
  });

  it("ouvre le formulaire pré-rempli quand je clique sur « Modifier », et le referme sur « Annuler »", () => {
    const modifier = vi.fn(async () => ({}));
    afficher(enDemo(), { actions: { modifier } });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Modifier" }));
    expect((within(fiche()).getByLabelText("Nom") as HTMLInputElement).value).toBe("Claire Vasseur");

    fireEvent.click(within(fiche()).getByRole("button", { name: "Annuler" }));
    expect(within(fiche()).queryByLabelText("Nom")).toBeNull();
    expect(modifier).not.toHaveBeenCalled();
  });

  it("supprime le contact après confirmation", async () => {
    const supprimer = vi.fn(async () => {});
    afficher(enDemo(), { actions: { supprimer } });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Supprimer le contact" }));
    expect(supprimer).not.toHaveBeenCalled();
    within(fiche()).getByText("Supprimer Claire Vasseur ? Cette action est définitive.");
    await act(async () => {
      fireEvent.click(within(fiche()).getByRole("button", { name: "Confirmer la suppression" }));
    });

    expect(supprimer).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("ne supprime rien quand j'annule la suppression", () => {
    const supprimer = vi.fn(async () => {});
    afficher(enDemo(), { actions: { supprimer } });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Supprimer le contact" }));
    fireEvent.click(within(fiche()).getByRole("button", { name: "Annuler" }));

    expect(supprimer).not.toHaveBeenCalled();
    expect(within(fiche()).queryByText(/Cette action est définitive/)).toBeNull();
  });

  it("se ferme avec le bouton de fermeture", () => {
    const onFerme = vi.fn();
    afficher(enDemo(), { onFerme });

    fireEvent.click(within(fiche()).getByRole("button", { name: "Fermer la fiche" }));

    expect(onFerme).toHaveBeenCalled();
  });
});
