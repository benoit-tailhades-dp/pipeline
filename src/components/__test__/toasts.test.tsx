import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";

import { FournisseurToasts, useToast } from "../toasts";

function Declencheur({ message, annuler }: { message: string; annuler?: () => void }) {
  const afficher = useToast();
  return <Button onClick={() => afficher(message, annuler)}>Déclencher</Button>;
}

function afficher(message = "Claire Vasseur passe à « Démo planifiée ».", annuler?: () => void) {
  return render(
    <FournisseurToasts>
      <Declencheur message={message} annuler={annuler} />
    </FournisseurToasts>,
  );
}

describe("Toasts", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("affiche le message, et annule l'action avec « Annuler »", () => {
    const annuler = vi.fn();
    afficher(undefined, annuler);

    fireEvent.click(screen.getByRole("button", { name: "Déclencher" }));
    screen.getByText("Claire Vasseur passe à « Démo planifiée ».");
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(annuler).toHaveBeenCalledOnce();
    expect(screen.queryByText("Claire Vasseur passe à « Démo planifiée ».")).toBeNull();
  });

  it("ne propose pas « Annuler » sans action à annuler", () => {
    afficher("Fiche de Claire Vasseur supprimée.");

    fireEvent.click(screen.getByRole("button", { name: "Déclencher" }));

    screen.getByText("Fiche de Claire Vasseur supprimée.");
    expect(screen.queryByRole("button", { name: "Annuler" })).toBeNull();
  });

  it("se ferme avec « Fermer le message »", () => {
    afficher();

    fireEvent.click(screen.getByRole("button", { name: "Déclencher" }));
    fireEvent.click(screen.getByRole("button", { name: "Fermer le message" }));

    expect(screen.queryByText(/passe à/)).toBeNull();
  });

  it("disparaît seul après 6 secondes", () => {
    vi.useFakeTimers();
    afficher();

    fireEvent.click(screen.getByRole("button", { name: "Déclencher" }));
    act(() => {
      vi.advanceTimersByTime(5900);
    });
    screen.getByText(/passe à/);
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.queryByText(/passe à/)).toBeNull();
  });
});
