import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ContactSuivi, EtapeDuParcours } from "@/services/contact-service";

import { CarteContact } from "../carte-contact";

/** Liste telle que la renvoie le service : la présentation ne la reconstruit pas. */
const etapes: EtapeDuParcours[] = [
  { code: "a-contacter", temperature: "froid" },
  { code: "premier-echange", temperature: "froid" },
  { code: "demo", temperature: "tiede" },
  { code: "proposition", temperature: "chaud" },
  { code: "gagne", temperature: "signe" },
];

const nouveau: ContactSuivi = {
  id: 7,
  nom: "Claire Vasseur",
  entreprise: "Ateliers Vernier",
  creeLe: new Date("2026-11-18T09:00:00.000Z"),
  etape: "a-contacter",
  temperature: "froid",
  position: 1,
  suivante: "premier-echange",
};

const enDemo: ContactSuivi = {
  ...nouveau,
  etape: "demo",
  temperature: "tiede",
  position: 3,
  suivante: "proposition",
};

const enProposition: ContactSuivi = {
  ...nouveau,
  etape: "proposition",
  temperature: "chaud",
  position: 4,
  suivante: "gagne",
};

const gagne: ContactSuivi = {
  ...nouveau,
  etape: "gagne",
  temperature: "signe",
  position: 5,
  suivante: null,
};

function afficher(
  contact: ContactSuivi,
  actions: {
    avancerAction?: (id: number) => Promise<void>;
    changerEtapeAction?: (id: number, etape: string) => Promise<void>;
  } = {},
) {
  return render(
    <CarteContact
      contact={contact}
      etapes={etapes}
      avancerAction={actions.avancerAction ?? (async () => {})}
      changerEtapeAction={actions.changerEtapeAction ?? (async () => {})}
    />,
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
    const avancerAction = vi.fn(async () => {});
    afficher(enDemo, { avancerAction });

    fireEvent.click(screen.getByRole("button", { name: "Étape suivante" }));

    expect(avancerAction).toHaveBeenCalledExactlyOnceWith(7);
  });

  it("ne propose pas « Étape suivante » pour un contact « Gagné »", () => {
    afficher(gagne);

    expect(screen.queryByRole("button", { name: "Étape suivante" })).toBeNull();
    // L'étape reste corrigeable depuis la liste.
    expect(etapeAffichee()).toBe("Gagné");
  });

  it("transmet l'étape choisie dans la liste des étapes", async () => {
    const changerEtapeAction = vi.fn(async () => {});
    afficher(enProposition, { changerEtapeAction });

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

    expect(changerEtapeAction).toHaveBeenCalledExactlyOnceWith(7, "premier-echange");
  });
});
