import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Input } from "@/components/ui/input";
import type { ContactSuivi } from "@/services/contact-service";

import { FournisseurToasts } from "../../toasts";
import type { ActionsContact } from "../actions-contact";
import { TableauContacts } from "../tableau-contacts";
import { actionsInertes, colonnes, contactSuivi, enDemo, parTexte } from "./fixtures";

const marc = contactSuivi({ id: 2, nom: "Marc Delorme", entreprise: "Cartonnages Merlet" });
const ines = contactSuivi({
  id: 3,
  nom: "Inès Garnier",
  etape: "proposition",
  temperature: "chaud",
  position: 4,
  suivante: "gagne",
});
const paul = contactSuivi({
  id: 4,
  nom: "Paul Roche",
  etape: "gagne",
  temperature: "signe",
  position: 5,
  suivante: null,
});

function afficher(contacts: ContactSuivi[], actions: Partial<ActionsContact> = {}) {
  return render(
    <FournisseurToasts>
      <TableauContacts
        colonnes={colonnes(contacts)}
        actions={{ ...actionsInertes, ...actions }}
        ajouterAction={async () => ({})}
        recherche={<Input id="recherche" aria-label="Rechercher un contact" />}
      />
    </FournisseurToasts>,
  );
}

/** Glisse la carte de Claire, en « Démo planifiée », dans « Proposition envoyée ». */
async function glisserClaireEnProposition() {
  const carte = screen.getByRole("heading", { name: "Claire Vasseur" }).closest("article")!;
  fireEvent.mouseDown(carte, { button: 0, clientX: 650, clientY: 100 });
  fireEvent.mouseMove(document, { clientX: 660, clientY: 100 });
  fireEvent.mouseMove(document, { clientX: 950, clientY: 300 });
  await act(async () => {
    fireEvent.mouseUp(document, { clientX: 950, clientY: 300 });
  });
}

function colonne(nom: string) {
  return screen.getByRole("region", { name: nom });
}

function nomsDans(nomColonne: string) {
  return within(colonne(nomColonne))
    .queryAllByRole("heading", { level: 3 })
    .map((titre) => titre.textContent);
}

/**
 * jsdom ne calcule aucune géométrie : on place les colonnes côte à côte (300 px chacune)
 * et chaque carte dans sa colonne, pour que le glisser-déposer trouve où il est lâché.
 */
function poserLesColonnes() {
  const ordre = ["a-contacter", "premier-echange", "demo", "proposition", "gagne"];
  return vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (
    this: Element,
  ) {
    const porteur = this.closest("[data-etape]");
    const rang = porteur ? ordre.indexOf(porteur.getAttribute("data-etape") ?? "") : -1;
    const estColonne = this === porteur;
    const x = rang * 300 + (estColonne ? 0 : 10);
    const largeur = estColonne ? 280 : 260;
    const hauteur = estColonne ? 800 : 100;
    const y = estColonne ? 0 : 60;
    return {
      x,
      y,
      left: x,
      top: y,
      width: rang < 0 ? 0 : largeur,
      height: rang < 0 ? 0 : hauteur,
      right: x + largeur,
      bottom: y + hauteur,
      toJSON: () => ({}),
    } as DOMRect;
  });
}

describe("TableauContacts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("affiche les cinq colonnes dans l'ordre, chacune avec son nombre de contacts", () => {
    afficher([enDemo(), marc, ines, paul]);

    const titres = screen.getAllByRole("heading", { level: 2 }).map((titre) => titre.textContent);
    expect(titres).toEqual([
      "À contacter",
      "Premier échange",
      "Démo planifiée",
      "Proposition envoyée",
      "Gagné",
    ]);
    within(colonne("À contacter")).getByText(parTexte("1 contact"));
    within(colonne("Premier échange")).getByText(parTexte("0 contact"));
    within(colonne("Démo planifiée")).getByText(parTexte("1 contact"));
  });

  it("range chaque contact dans la colonne de son étape, dans l'ordre reçu", () => {
    const sophie = enDemo({ id: 5, nom: "Sophie Lambert" });
    afficher([enDemo(), marc, ines, paul, sophie]);

    expect(nomsDans("À contacter")).toEqual(["Marc Delorme"]);
    expect(nomsDans("Démo planifiée")).toEqual(["Claire Vasseur", "Sophie Lambert"]);
    expect(nomsDans("Proposition envoyée")).toEqual(["Inès Garnier"]);
    expect(nomsDans("Gagné")).toEqual(["Paul Roche"]);
  });

  it("invite à ajouter un premier contact quand il n'y en a aucun", () => {
    afficher([]);

    within(colonne("À contacter")).getByText("Aucun contact pour l’instant. Ajoutez votre premier contact.");
    within(colonne("Démo planifiée")).getByText("Glissez une carte ici.");
  });

  it("change l'étape quand je glisse une carte dans une autre colonne, et l'y affiche aussitôt", async () => {
    poserLesColonnes();
    const changerEtape = vi.fn(() => new Promise<void>(() => {}));
    afficher([enDemo(), ines], { changerEtape });
    const carte = screen.getByRole("heading", { name: "Claire Vasseur" }).closest("article")!;

    // La carte est dans « Démo planifiée » (x de 600 à 880) ; on la lâche dans « Proposition envoyée ».
    fireEvent.mouseDown(carte, { button: 0, clientX: 650, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 660, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 950, clientY: 300 });
    await act(async () => {
      fireEvent.mouseUp(document, { clientX: 950, clientY: 300 });
    });

    expect(changerEtape).toHaveBeenCalledExactlyOnceWith(7, "proposition");
    expect(nomsDans("Proposition envoyée")).toContain("Claire Vasseur");
    expect(nomsDans("Démo planifiée")).toEqual([]);
  });

  it("ne reste pas en position de glisser quand le geste est plus rapide qu'un rendu", () => {
    poserLesColonnes();
    afficher([enDemo()]);
    const carte = screen.getByRole("heading", { name: "Claire Vasseur" }).closest("article")!;

    // Tout le geste dans un seul lot : React ne réaffiche rien avant le relâchement.
    act(() => {
      fireEvent.mouseDown(carte, { button: 0, clientX: 650, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 660, clientY: 100 });
      fireEvent.mouseMove(document, { clientX: 950, clientY: 300 });
      fireEvent.mouseUp(document, { clientX: 950, clientY: 300 });
    });

    // Pendant un glisser, les colonnes affichent leur contour de dépôt : il doit avoir disparu.
    const enAttenteDeDepot = screen
      .getAllByRole("region")
      .filter((colonne) => colonne.classList.contains("outline-dashed"));
    expect(enAttenteDeDepot).toEqual([]);
  });

  it("ramène la carte dans sa colonne quand j'annule le déplacement", async () => {
    poserLesColonnes();
    const changerEtape = vi.fn(async () => {});
    afficher([enDemo()], { changerEtape });

    await glisserClaireEnProposition();
    screen.getByText("Claire Vasseur passe à « Proposition envoyée ».");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    });

    expect(changerEtape.mock.calls).toEqual([
      [7, "proposition"],
      [7, "demo"],
    ]);
  });

  it("ne change rien quand je lâche la carte dans sa propre colonne", async () => {
    poserLesColonnes();
    const changerEtape = vi.fn(async () => {});
    afficher([enDemo()], { changerEtape });
    const carte = screen.getByRole("heading", { name: "Claire Vasseur" }).closest("article")!;

    fireEvent.mouseDown(carte, { button: 0, clientX: 650, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 660, clientY: 100 });
    fireEvent.mouseMove(document, { clientX: 700, clientY: 400 });
    await act(async () => {
      fireEvent.mouseUp(document, { clientX: 700, clientY: 400 });
    });

    expect(changerEtape).not.toHaveBeenCalled();
  });

  it.each([
    ["ArrowRight", "proposition"],
    ["ArrowLeft", "premier-echange"],
  ])("change l'étape avec Maj + %s sur la carte de Claire, en « Démo planifiée »", async (touche, etape) => {
    const changerEtape = vi.fn(async () => {});
    afficher([enDemo()], { changerEtape });

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("button", { name: "Claire Vasseur" }), {
        key: touche,
        shiftKey: true,
      });
    });

    expect(changerEtape).toHaveBeenCalledExactlyOnceWith(7, etape);
  });

  it("ne va ni avant « À contacter » ni après « Gagné »", async () => {
    const changerEtape = vi.fn(async () => {});
    afficher([marc, paul], { changerEtape });

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("button", { name: "Marc Delorme" }), {
        key: "ArrowLeft",
        shiftKey: true,
      });
      fireEvent.keyDown(screen.getByRole("button", { name: "Paul Roche" }), {
        key: "ArrowRight",
        shiftKey: true,
      });
    });

    expect(changerEtape).not.toHaveBeenCalled();
  });

  it("passe à l'étape suivante avec la flèche de la carte", async () => {
    const changerEtape = vi.fn(async () => {});
    afficher([enDemo()], { changerEtape });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Passer à « Proposition envoyée »" }));
    });

    expect(changerEtape).toHaveBeenCalledExactlyOnceWith(7, "proposition");
  });

  it("ouvre la fiche du contact quand je clique sur sa carte", async () => {
    afficher([enDemo({ fonction: "Responsable PLM" })]);

    fireEvent.click(screen.getByRole("button", { name: "Claire Vasseur" }));

    const fiche = await screen.findByRole("dialog", { name: "Claire Vasseur" });
    within(fiche).getByText("Responsable PLM, Ateliers Vernier");
  });

  it("ferme la fiche avec Échap", async () => {
    afficher([enDemo()]);
    fireEvent.click(screen.getByRole("button", { name: "Claire Vasseur" }));
    const fiche = await screen.findByRole("dialog", { name: "Claire Vasseur" });

    fireEvent.keyDown(fiche, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("ouvre le formulaire d'ajout avec la touche N", () => {
    afficher([marc]);

    fireEvent.keyDown(document.body, { key: "n" });

    within(colonne("À contacter")).getByLabelText("Nom");
  });

  it("place le curseur dans la recherche avec la touche /", () => {
    afficher([marc]);

    fireEvent.keyDown(document.body, { key: "/" });

    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Rechercher un contact" }));
  });

  it("n'intercepte pas N pendant une saisie", () => {
    afficher([marc]);
    const recherche = screen.getByRole("textbox", { name: "Rechercher un contact" });

    fireEvent.keyDown(recherche, { key: "n" });

    expect(screen.queryByLabelText("Nom")).toBeNull();
  });

  it("annonce une recherche sans résultat dans les colonnes vides", () => {
    render(
      <TableauContacts
        colonnes={colonnes([])}
        actions={actionsInertes}
        ajouterAction={async () => ({})}
        filtre="zzz"
      />,
    );

    within(colonne("Démo planifiée")).getByText("Aucun résultat.");
    screen.getByText("0 contact pour « zzz »");
  });

  it("ouvre le formulaire d'ajout en tête de « À contacter »", () => {
    afficher([marc]);
    expect(screen.queryByLabelText("Nom")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Nouveau contact" }));

    within(colonne("À contacter")).getByLabelText("Nom");
    fireEvent.click(screen.getByRole("button", { name: "Fermer le formulaire" }));
    expect(screen.queryByLabelText("Nom")).toBeNull();

    fireEvent.click(within(colonne("À contacter")).getByRole("button", { name: "Ajouter un contact" }));
    within(colonne("À contacter")).getByLabelText("Nom");
  });
});
