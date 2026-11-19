import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MarquerRelance, type EtatMarquage, type SaisieMarquage } from "../marquer-relance";
import { datesRapides } from "./fixtures";

function afficher(marquer: (id: number, saisie: SaisieMarquage) => Promise<EtatMarquage>) {
  return render(<MarquerRelance id={7} marquerAction={marquer} datesRapides={datesRapides} />);
}

function marquer() {
  fireEvent.click(screen.getByRole("button", { name: "Marquer comme relancé" }));
}

describe("MarquerRelance", () => {
  it("remplit la relance suivante au 25 novembre quand je choisis « Dans 1 semaine »", async () => {
    const action = vi.fn(async () => ({}));
    afficher(action);

    const semaine = screen.getByRole("button", { name: /^Dans 1 semaine/ });
    fireEvent.click(semaine);
    expect((screen.getByLabelText(/Relance suivante/) as HTMLInputElement).value).toBe("2026-11-25");
    expect(semaine.getAttribute("aria-pressed")).toBe("true");
    marquer();

    await waitFor(() =>
      expect(action).toHaveBeenCalledExactlyOnceWith(7, { note: "", prochaineRelance: "2026-11-25" }),
    );
  });

  it("propose une note et une relance suivante, toutes deux facultatives", () => {
    afficher(async () => ({}));

    expect((screen.getByLabelText(/Note/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/Relance suivante/) as HTMLInputElement).value).toBe("");
  });

  it("transmet le marquage sans note ni relance suivante", async () => {
    const action = vi.fn(async () => ({}));
    afficher(action);

    marquer();

    await waitFor(() =>
      expect(action).toHaveBeenCalledExactlyOnceWith(7, { note: "", prochaineRelance: "" }),
    );
  });

  it("transmet la note et la relance suivante saisies", async () => {
    const action = vi.fn(async () => ({}));
    afficher(action);

    fireEvent.change(screen.getByLabelText(/Note/), {
      target: { value: "Rappeler après l'audit de juin" },
    });
    fireEvent.change(screen.getByLabelText(/Relance suivante/), {
      target: { value: "2026-12-02" },
    });
    marquer();

    await waitFor(() =>
      expect(action).toHaveBeenCalledExactlyOnceWith(7, {
        note: "Rappeler après l'audit de juin",
        prochaineRelance: "2026-12-02",
      }),
    );
  });

  it("affiche le refus du service sous la relance suivante, sans perdre la saisie", async () => {
    const message = "La relance suivante doit tomber après aujourd'hui.";
    afficher(async (_id, saisie) => ({ erreurs: { prochaineRelance: message }, valeurs: saisie }));

    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: "Pas joignable" } });
    fireEvent.change(screen.getByLabelText(/Relance suivante/), {
      target: { value: "2026-11-18" },
    });
    marquer();

    const erreur = await screen.findByText(message);
    const date = screen.getByLabelText(/Relance suivante/) as HTMLInputElement;
    expect(date.getAttribute("aria-invalid")).toBe("true");
    expect(date.getAttribute("aria-describedby")).toBe(erreur.id);
    expect(date.value).toBe("2026-11-18");
    expect((screen.getByLabelText(/Note/) as HTMLInputElement).value).toBe("Pas joignable");
  });

  it("affiche le refus d'une note trop longue sous la note, sans perdre la saisie", async () => {
    const message = "La note ne doit pas dépasser 2 000 caractères.";
    afficher(async (_id, saisie) => ({ erreurs: { note: message }, valeurs: saisie }));

    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: "Très longue note" } });
    marquer();

    const erreur = await screen.findByText(message);
    const note = screen.getByLabelText(/Note/) as HTMLInputElement;
    expect(note.getAttribute("aria-invalid")).toBe("true");
    expect(note.getAttribute("aria-describedby")).toBe(erreur.id);
    expect(note.value).toBe("Très longue note");
    expect(screen.getByLabelText(/Relance suivante/).getAttribute("aria-invalid")).toBeNull();
  });

  it("affiche l'erreur générale quand le contact n'existe plus", async () => {
    afficher(async (_id, saisie) => ({
      erreurs: { contact: "Ce contact n'existe plus." },
      valeurs: saisie,
    }));

    marquer();

    await screen.findByText("Ce contact n'existe plus.");
  });
});
