"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDndContext,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { PlusIcon } from "lucide-react";
import { startTransition, useEffect, useId, useOptimistic, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toasts";
import { cn } from "@/lib/utils";
import type {
  ColonneDuTableau,
  ContactSuivi,
  DateRapide,
  Etape,
} from "@/services/contact-service";

import type { ActionsContact } from "./actions-contact";
import { CarteContact } from "./carte-contact";
import { FicheTiroir } from "./fiche-tiroir";
import { FormulaireContact, type ActionFormulaireContact } from "./formulaire-contact";
import { ID_RECHERCHE } from "./recherche";
import { LIBELLES_ETAPES, MiniPiste, TEMPERATURES } from "./temperature";

interface Deplacement {
  id: number;
  etape: Etape;
}

function trouver(colonnes: ColonneDuTableau[], id: number): ContactSuivi | null {
  for (const colonne of colonnes) {
    const contact = colonne.contacts.find((c) => c.id === id);
    if (contact) return contact;
  }
  return null;
}

/**
 * Affichage immédiat d'un déplacement, en attendant la réponse du serveur : la carte passe
 * en tête de sa nouvelle colonne, avec la température de cette colonne. Le rafraîchissement
 * qui suit la Server Action rétablit l'ordre décidé par le service.
 */
function deplacerDans(colonnes: ColonneDuTableau[], { id, etape }: Deplacement): ColonneDuTableau[] {
  const contact = trouver(colonnes, id);
  const cible = colonnes.find((c) => c.code === etape);
  if (!contact || !cible || contact.etape === etape) return colonnes;
  const deplace = { ...contact, etape, temperature: cible.temperature };
  return colonnes.map((colonne) =>
    colonne.code === etape
      ? { ...colonne, contacts: [deplace, ...colonne.contacts] }
      : { ...colonne, contacts: colonne.contacts.filter((c) => c.id !== id) },
  );
}

function nomDe(donnees: { current?: Record<string, unknown> }): string {
  const nom = donnees.current?.nom;
  return typeof nom === "string" ? nom : "La carte";
}

function libelleDe(id: string | number): string {
  return LIBELLES_ETAPES[id as Etape] ?? String(id);
}

const annonces: Announcements = {
  onDragStart: ({ active }) => `Carte de ${nomDe(active.data)} en main.`,
  onDragOver: ({ active, over }) =>
    over
      ? `Carte de ${nomDe(active.data)} au-dessus de « ${libelleDe(over.id)} ».`
      : `Carte de ${nomDe(active.data)} hors des colonnes.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `Carte de ${nomDe(active.data)} déposée dans « ${libelleDe(over.id)} ».`
      : `Carte de ${nomDe(active.data)} reposée à sa place.`,
  onDragCancel: ({ active }) => `Déplacement de la carte de ${nomDe(active.data)} annulé.`,
};

const instructions = {
  draggable:
    "Pour changer l’étape au clavier : Majuscule et flèche droite ou gauche sur le nom du contact.",
};

interface RappelsCarte {
  onOuvrir: (id: number) => void;
  onDeplacer: (contact: ContactSuivi, sens: 1 | -1) => void;
  onAvancer: (contact: ContactSuivi) => void;
}

function CarteDeplacable({ contact, onOuvrir, onDeplacer, onAvancer }: { contact: ContactSuivi } & RappelsCarte) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: contact.id,
    data: { nom: contact.nom },
  });
  return (
    <CarteContact
      ref={setNodeRef}
      {...listeners}
      contact={contact}
      className={cn(isDragging && "opacity-40")}
      onOuvrir={() => onOuvrir(contact.id)}
      onDeplacer={(sens) => onDeplacer(contact, sens)}
      onAvancer={() => onAvancer(contact)}
    />
  );
}

/** En-tête d'une colonne : point de température, étape, nombre de contacts et repère dans le parcours. */
export function EnTeteColonne({
  colonne,
  rang,
  colonnes,
  idTitre,
  onAjouter,
}: {
  colonne: ColonneDuTableau;
  rang: number;
  colonnes: readonly ColonneDuTableau[];
  idTitre?: string;
  onAjouter?: () => void;
}) {
  const nombre = colonne.contacts.length;
  return (
    <header className="grid gap-2.5 px-3.5 pt-3 pb-2.5">
      <div className="flex min-h-7 items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2.5 shrink-0 rounded-full", TEMPERATURES[colonne.temperature].plein)}
        />
        <h2 id={idTitre} className="min-w-0 flex-1 truncate text-sm font-bold">
          {LIBELLES_ETAPES[colonne.code]}
        </h2>
        <Badge variant="outline" className="bg-card text-muted-foreground tabular-nums">
          {nombre}
          <span className="sr-only"> {nombre > 1 ? "contacts" : "contact"}</span>
        </Badge>
        {onAjouter && (
          <Button variant="ghost" size="icon-xs" aria-label="Ajouter un contact" onClick={onAjouter}>
            <PlusIcon />
          </Button>
        )}
      </div>
      <MiniPiste etapes={colonnes} rang={rang} />
    </header>
  );
}

function Colonne({
  colonne,
  rang,
  colonnes,
  enMain,
  formulaire,
  onAjouter,
  aucunContact,
  filtre,
  ...rappels
}: {
  colonne: ColonneDuTableau;
  rang: number;
  colonnes: ColonneDuTableau[];
  enMain: ContactSuivi | null;
  /** Le tableau entier est vide : la première colonne invite au premier ajout. */
  aucunContact: boolean;
  /** Recherche en cours : une colonne vide l'est faute de résultat. */
  filtre: string;
  /** Le formulaire d'ajout, affiché en tête de la première colonne. */
  formulaire: React.ReactNode;
  onAjouter?: () => void;
} & RappelsCarte) {
  const { setNodeRef, isOver } = useDroppable({ id: colonne.code });
  const idTitre = useId();
  const temperature = TEMPERATURES[colonne.temperature];
  const visee = isOver && enMain !== null && enMain.etape !== colonne.code;
  const nombre = colonne.contacts.length;

  return (
    <section
      ref={setNodeRef}
      data-etape={colonne.code}
      aria-labelledby={idTitre}
      className={cn(
        "flex w-5/6 shrink-0 snap-start flex-col rounded-2xl bg-colonne outline-2 -outline-offset-2 outline-transparent transition-colors sm:w-auto sm:min-w-60 sm:flex-1",
        enMain && "outline-dashed outline-bord-fort",
        visee && temperature.survol,
      )}
    >
      <EnTeteColonne
        colonne={colonne}
        rang={rang}
        colonnes={colonnes}
        idTitre={idTitre}
        onAjouter={onAjouter}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
        {formulaire}
        {visee && (
          <div
            aria-hidden
            className={cn("h-24 shrink-0 rounded-xl border-2 border-dashed", temperature.emplacement)}
          />
        )}
        {colonne.contacts.map((contact) => (
          <CarteDeplacable key={contact.id} contact={contact} {...rappels} />
        ))}
        {nombre === 0 && !formulaire && !visee && (
          <p className="grid min-h-20 place-items-center rounded-xl border-2 border-dashed border-bord-fort p-3 text-center text-sm text-muted-foreground">
            {filtre
              ? "Aucun résultat."
              : onAjouter && aucunContact
                ? "Aucun contact pour l’instant. Ajoutez votre premier contact."
                : "Glissez une carte ici."}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Les colonnes et la carte en main. La carte en main se lit dans le contexte de dnd-kit,
 * jamais dans un état à part : un geste plus rapide qu'un rendu se termine sans `onDragEnd`,
 * et un état à part resterait bloqué en position de glisser.
 */
function Plateau({
  colonnes,
  formulaire,
  onAjouter,
  filtre,
  rappels,
}: {
  colonnes: ColonneDuTableau[];
  formulaire: React.ReactNode;
  onAjouter: () => void;
  filtre: string;
  rappels: RappelsCarte;
}) {
  const { active } = useDndContext();
  const enMain = active ? trouver(colonnes, Number(active.id)) : null;
  const total = colonnes.reduce((somme, colonne) => somme + colonne.contacts.length, 0);

  return (
    <>
      {/* `select-none` : un geste de glisser ne doit pas sélectionner le texte des colonnes. */}
      <div className="flex min-h-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 select-none sm:snap-none sm:px-6">
        {colonnes.map((colonne, rang) => (
          <Colonne
            key={colonne.code}
            colonne={colonne}
            rang={rang}
            colonnes={colonnes}
            enMain={enMain}
            aucunContact={total === 0}
            filtre={filtre}
            formulaire={rang === 0 && formulaire}
            onAjouter={rang === 0 ? onAjouter : undefined}
            {...rappels}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {enMain && (
          <CarteContact
            contact={enMain}
            className="scale-103 rotate-2 cursor-grabbing border-bord-fort shadow-xl"
            onOuvrir={() => {}}
            onDeplacer={() => {}}
            onAvancer={() => {}}
          />
        )}
      </DragOverlay>
    </>
  );
}

/**
 * Le pipeline en colonnes. On change l'étape d'un contact en glissant sa carte
 * (souris, ou appui long au doigt), avec Maj + flèche au clavier, ou depuis sa fiche.
 */
export function TableauContacts({
  colonnes,
  actions,
  ajouterAction,
  datesRapides = [],
  recherche,
  filtre = "",
}: {
  colonnes: ColonneDuTableau[];
  actions: ActionsContact;
  ajouterAction: ActionFormulaireContact;
  datesRapides?: readonly DateRapide[];
  /** Le champ de recherche, fourni par la page. */
  recherche?: React.ReactNode;
  /** La recherche appliquée par le service aux colonnes reçues. */
  filtre?: string;
}) {
  const [affichees, deplacerOptimiste] = useOptimistic(colonnes, deplacerDans);
  const [formulaire, setFormulaire] = useState(false);
  const [fiche, setFiche] = useState<{ id: number; ouverte: boolean } | null>(null);
  const finDuGlisser = useRef(0);
  const capteurs = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );
  const etapes = affichees.map(({ code, temperature }) => ({ code, temperature }));
  const total = affichees.reduce((somme, colonne) => somme + colonne.contacts.length, 0);

  const afficherToast = useToast();
  const ficheOuverte = fiche?.ouverte ?? false;

  function appliquer(id: number, etape: Etape) {
    startTransition(async () => {
      deplacerOptimiste({ id, etape });
      await actions.changerEtape(id, etape);
    });
  }

  /** Change l'étape tout de suite, et propose d'annuler. */
  function deplacer(id: number, etape: Etape) {
    const contact = trouver(affichees, id);
    if (!contact || contact.etape === etape) return;
    const depuis = contact.etape;
    appliquer(id, etape);
    afficherToast(
      etape === "gagne"
        ? `Signé avec ${contact.entreprise ?? contact.nom}.`
        : `${contact.nom} passe à « ${LIBELLES_ETAPES[etape]} ».`,
      () => appliquer(id, depuis),
    );
  }

  // Raccourcis : N ouvre le formulaire d'ajout, / va dans la recherche. Pas pendant une saisie.
  useEffect(() => {
    function auClavier(event: KeyboardEvent) {
      if (ficheOuverte || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const cible = event.target;
      if (
        cible instanceof HTMLElement &&
        cible.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setFormulaire(true);
      } else if (event.key === "/") {
        const champ = document.getElementById(ID_RECHERCHE);
        if (champ) {
          event.preventDefault();
          champ.focus();
        }
      }
    }
    document.addEventListener("keydown", auClavier);
    return () => document.removeEventListener("keydown", auClavier);
  }, [ficheOuverte]);

  const rappels: RappelsCarte = {
    onOuvrir(id) {
      // Le clic qui termine un glisser-déposer n'ouvre pas la fiche.
      if (Date.now() - finDuGlisser.current < 250) return;
      setFiche({ id, ouverte: true });
    },
    onDeplacer(contact, sens) {
      const rang = affichees.findIndex((colonne) => colonne.code === contact.etape);
      const cible = affichees[rang + sens];
      if (cible) deplacer(contact.id, cible.code);
    },
    onAvancer(contact) {
      if (contact.suivante) deplacer(contact.id, contact.suivante);
    },
  };

  function aLaFin({ active, over }: DragEndEvent) {
    finDuGlisser.current = Date.now();
    const contact = trouver(affichees, Number(active.id));
    const cible = over ? affichees.find((colonne) => colonne.code === over.id) : undefined;
    if (contact && cible && cible.code !== contact.etape) deplacer(contact.id, cible.code);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3 px-4 pt-5 pb-3 sm:px-6">
        <div className="grid gap-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {`${total} ${total > 1 ? "contacts" : "contact"}${filtre ? ` pour « ${filtre} »` : ""}`}
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {recherche}
          <Button aria-keyshortcuts="N" onClick={() => setFormulaire(true)}>
            <PlusIcon data-icon="inline-start" />
            Nouveau contact
          </Button>
        </div>
      </div>

      <DndContext
        sensors={capteurs}
        collisionDetection={pointerWithin}
        onDragEnd={aLaFin}
        accessibility={{ announcements: annonces, screenReaderInstructions: instructions }}
      >
        <Plateau
          colonnes={affichees}
          formulaire={
            formulaire && (
              <FormulaireContact action={ajouterAction} onFerme={() => setFormulaire(false)} />
            )
          }
          onAjouter={() => setFormulaire(true)}
          filtre={filtre}
          rappels={rappels}
        />
      </DndContext>

      <FicheTiroir
        contact={fiche ? trouver(affichees, fiche.id) : null}
        ouvert={fiche?.ouverte ?? false}
        etapes={etapes}
        datesRapides={datesRapides}
        actions={actions}
        deplacer={deplacer}
        onFerme={() => setFiche((actuelle) => actuelle && { ...actuelle, ouverte: false })}
      />
    </div>
  );
}
