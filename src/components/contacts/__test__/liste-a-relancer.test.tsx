import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactARelancer } from "@/services/contact-service";

import { ListeARelancer as Liste } from "../liste-a-relancer";
import { contactARelancer, datesRapides } from "./fixtures";

function ListeARelancer({
  contacts,
  planifier = async () => ({}),
}: {
  contacts: ContactARelancer[];
  planifier?: (id: number, date: string) => Promise<{ erreur?: string }>;
}) {
  return (
    <Liste
      contacts={contacts}
      marquerAction={async () => ({})}
      planifierAction={planifier}
      datesRapides={datesRapides}
    />
  );
}

describe("ListeARelancer", () => {
  it("affiche un contact dont la relance tombe aujourd'hui", () => {
    render(<ListeARelancer contacts={[contactARelancer({ retard: 0 })]} />);

    const element = screen.getByRole("listitem");
    within(element).getByRole("heading", { name: "Claire Vasseur" });
    within(element).getByText("Ateliers Vernier");
    within(element).getByText("Prévue aujourd’hui");
    expect(within(element).queryByText(/En retard/)).toBeNull();
  });

  it("marque un contact « En retard de 3 jours »", () => {
    render(
      <ListeARelancer contacts={[contactARelancer({ relanceLe: "2026-11-15", retard: 3 })]} />,
    );

    screen.getByText("En retard de 3 jours");
  });

  it("écrit « 1 jour » au singulier", () => {
    render(
      <ListeARelancer contacts={[contactARelancer({ relanceLe: "2026-11-17", retard: 1 })]} />,
    );

    screen.getByText("En retard de 1 jour");
  });

  it("affiche les contacts dans l'ordre reçu du service", () => {
    render(
      <ListeARelancer
        contacts={[
          contactARelancer({ id: 2, nom: "Marc Delorme", retard: 3 }),
          contactARelancer({ id: 1, nom: "Claire Vasseur", retard: 0 }),
        ]}
      />,
    );

    const noms = screen
      .getAllByRole("listitem")
      .map((element) => within(element).getByRole("heading").textContent);
    expect(noms).toEqual(["Marc Delorme", "Claire Vasseur"]);
  });

  it("affiche « Personne à relancer aujourd’hui. » quand aucune relance n'est due", () => {
    render(<ListeARelancer contacts={[]} />);

    screen.getByText("Personne à relancer aujourd’hui.");
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("reporte la relance à demain quand je choisis « Reporter » puis « Demain »", async () => {
    const planifier = vi.fn(async () => ({}));
    render(<ListeARelancer contacts={[contactARelancer()]} planifier={planifier} />);
    const element = screen.getByRole("listitem");
    expect(within(element).queryByRole("group", { name: "Reporter au" })).toBeNull();

    fireEvent.click(within(element).getByRole("button", { name: "Reporter" }));
    const reporter = within(element).getByRole("group", { name: "Reporter au" });
    fireEvent.click(within(reporter).getByRole("button", { name: /^Demain/ }));

    await waitFor(() => expect(planifier).toHaveBeenCalledExactlyOnceWith(7, "2026-11-19"));
  });

  it("propose de marquer chaque contact comme relancé", () => {
    render(<ListeARelancer contacts={[contactARelancer()]} />);

    within(screen.getByRole("listitem")).getByRole("button", { name: "Marquer comme relancé" });
  });
});
