import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactSuivi } from "@/services/contact-service";

import { CarteContact } from "../carte-contact";
import { contactSuivi, enDemo, parTexte } from "./fixtures";

function afficher(
  contact: ContactSuivi,
  rappels: Partial<Record<"onOuvrir" | "onAvancer" | "onDeplacer", () => void>> = {},
) {
  return render(
    <CarteContact
      contact={contact}
      onOuvrir={rappels.onOuvrir ?? (() => {})}
      onAvancer={rappels.onAvancer ?? (() => {})}
      onDeplacer={rappels.onDeplacer ?? (() => {})}
    />,
  );
}

const gagne = contactSuivi({ etape: "gagne", temperature: "signe", position: 5, suivante: null });

describe("CarteContact", () => {
  it("affiche le nom, l'entreprise et la note", () => {
    afficher(enDemo({ note: "Veut migrer ses nomenclatures avant l’audit de juin." }));

    screen.getByRole("heading", { name: "Claire Vasseur" });
    screen.getByText("Ateliers Vernier");
    screen.getByText("Veut migrer ses nomenclatures avant l’audit de juin.");
  });

  it("affiche la fonction quand l'entreprise manque", () => {
    afficher(contactSuivi({ entreprise: null, fonction: "Responsable PLM" }));

    screen.getByText("Responsable PLM");
  });

  it.each([
    [{ relanceLe: "2026-11-15", retardRelance: 3 }, "En retard de 3 j"],
    [{ relanceLe: "2026-11-18", retardRelance: 0 }, "Aujourd’hui"],
    [{ relanceLe: "2026-11-19", retardRelance: -1 }, "Demain"],
    [{ relanceLe: "2026-11-24", retardRelance: -6 }, "Relance le 24 nov."],
    [{ relanceLe: null, retardRelance: null }, "Sans relance"],
  ])("indique la relance %j par « %s »", (champs, texte) => {
    afficher(enDemo(champs));

    screen.getByText(parTexte(texte));
  });

  it("indique « Signé » pour un contact gagné sans relance", () => {
    afficher(gagne);

    screen.getByText(parTexte("Signé"));
    expect(screen.queryByText(parTexte("Sans relance"))).toBeNull();
  });

  it.each([
    [0, "2026-11-18", "Dernier échange : aujourd’hui"],
    [1, "2026-11-17", "Dernier échange : hier"],
    [14, "2026-11-04", "Dernier échange : il y a 14 j"],
  ])("indique un dernier échange vieux de %i jours", (jours, date, texte) => {
    afficher(enDemo({ dernierEchangeLe: date, joursDepuisDernierEchange: jours }));

    screen.getByText(parTexte(texte));
  });

  it("n'indique pas de dernier échange quand il n'y en a pas eu", () => {
    afficher(enDemo());

    expect(screen.queryByText(/Dernier échange/)).toBeNull();
  });

  it("ouvre la fiche quand je clique sur la carte ou sur le nom", () => {
    const onOuvrir = vi.fn();
    afficher(enDemo(), { onOuvrir });

    fireEvent.click(screen.getByText("Ateliers Vernier"));
    fireEvent.click(screen.getByRole("button", { name: "Claire Vasseur" }));

    expect(onOuvrir).toHaveBeenCalledTimes(2);
  });

  it("passe à l'étape suivante avec la flèche, sans ouvrir la fiche", () => {
    const onOuvrir = vi.fn();
    const onAvancer = vi.fn();
    afficher(enDemo(), { onOuvrir, onAvancer });

    fireEvent.click(screen.getByRole("button", { name: "Passer à « Proposition envoyée »" }));

    expect(onAvancer).toHaveBeenCalledOnce();
    expect(onOuvrir).not.toHaveBeenCalled();
  });

  it("ne propose pas d'étape suivante pour un contact gagné", () => {
    afficher(gagne);

    expect(screen.queryByRole("button", { name: /Passer à/ })).toBeNull();
  });

  it("change d'étape avec Maj + → et Maj + ← sur le nom", () => {
    const onDeplacer = vi.fn();
    afficher(enDemo(), { onDeplacer });
    const nom = screen.getByRole("button", { name: "Claire Vasseur" });

    fireEvent.keyDown(nom, { key: "ArrowRight", shiftKey: true });
    fireEvent.keyDown(nom, { key: "ArrowLeft", shiftKey: true });
    fireEvent.keyDown(nom, { key: "ArrowRight" });

    expect(onDeplacer.mock.calls).toEqual([[1], [-1]]);
  });
});
