import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactSuivi } from "@/services/contact-service";

import { RelanceContact, type EtatRelance } from "../relance-contact";
import { contactSuivi } from "./fixtures";

function afficher(
  contact: ContactSuivi,
  actions: {
    planifier?: (id: number, date: string) => Promise<EtatRelance>;
    retirer?: (id: number) => Promise<void>;
  } = {},
) {
  return render(
    <RelanceContact
      contact={contact}
      planifierAction={actions.planifier ?? (async () => ({}))}
      retirerAction={actions.retirer ?? (async () => {})}
    />,
  );
}

function champDate() {
  return screen.getByLabelText("Date de relance") as HTMLInputElement;
}

describe("RelanceContact", () => {
  it("affiche « Relance le 24 nov. » pour une relance planifiée au 24 novembre", () => {
    afficher(contactSuivi({ relanceLe: "2026-11-24" }));

    screen.getByText("Relance le 24 nov.");
    expect(champDate().value).toBe("2026-11-24");
  });

  it("n'affiche aucune date de relance quand il n'y en a pas", () => {
    afficher(contactSuivi({ relanceLe: null }));

    expect(screen.queryByText(/^Relance le/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Retirer la relance" })).toBeNull();
    expect(champDate().value).toBe("");
  });

  it("transmet la date choisie quand je planifie la relance", async () => {
    const planifier = vi.fn(async () => ({}));
    afficher(contactSuivi(), { planifier });

    fireEvent.change(champDate(), { target: { value: "2026-11-24" } });
    fireEvent.click(screen.getByRole("button", { name: "Planifier la relance" }));

    await waitFor(() => expect(planifier).toHaveBeenCalledExactlyOnceWith(7, "2026-11-24"));
  });

  it("affiche le refus du service sous la date, sans perdre la saisie", async () => {
    const message = "La relance doit tomber aujourd'hui ou plus tard.";
    afficher(contactSuivi(), {
      planifier: async (_id, date) => ({ erreur: message, valeur: date }),
    });

    fireEvent.change(champDate(), { target: { value: "2026-11-17" } });
    fireEvent.click(screen.getByRole("button", { name: "Planifier la relance" }));

    const erreur = await screen.findByText(message);
    expect(champDate().getAttribute("aria-invalid")).toBe("true");
    expect(champDate().getAttribute("aria-describedby")).toBe(erreur.id);
    expect(champDate().value).toBe("2026-11-17");
  });

  it("propose de modifier une relance déjà planifiée", () => {
    afficher(contactSuivi({ relanceLe: "2026-11-24" }));

    screen.getByRole("button", { name: "Modifier la relance" });
  });

  it("transmet l'identifiant du contact quand je retire la relance", () => {
    const retirer = vi.fn(async () => {});
    afficher(contactSuivi({ relanceLe: "2026-11-24" }), { retirer });

    fireEvent.click(screen.getByRole("button", { name: "Retirer la relance" }));

    expect(retirer).toHaveBeenCalledExactlyOnceWith(7);
  });
});
