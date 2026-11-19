"use client";

import { ChevronRightIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  ContactSuivi,
  DateRapide,
  Etape,
  EtapeDuParcours,
} from "@/services/contact-service";

import type { ActionsContact } from "./actions-contact";
import { formaterDateCourte } from "./dates";
import { FicheContact } from "./fiche-contact";
import { MarquerRelance } from "./marquer-relance";
import { RelanceContact } from "./relance-contact";
import { Avatar, LIBELLES_ETAPES, Pastille, TEMPERATURES } from "./temperature";

function Bloc({
  titre,
  action,
  children,
}: {
  titre: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3 border-b py-5 last:border-b-0">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{titre}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** La piste de la carte d'origine, devenue cliquable : chaque segment place le contact à cette étape. */
function PisteCliquable({
  contact,
  etapes,
  deplacer,
}: {
  contact: ContactSuivi;
  etapes: readonly EtapeDuParcours[];
  deplacer: (id: number, etape: Etape) => void;
}) {
  return (
    <div role="group" aria-label="Étape" className="grid grid-cols-5 gap-1.5">
      {etapes.map((etape, i) => {
        const courante = etape.code === contact.etape;
        return (
          <Button
            key={etape.code}
            variant="ghost"
            aria-current={courante ? "step" : undefined}
            className={cn(
              "h-auto flex-col items-stretch gap-2 rounded-lg px-0.5 py-1 text-left text-xs leading-tight font-normal whitespace-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
              courante && "font-bold text-foreground",
            )}
            onClick={() => {
              if (!courante) deplacer(contact.id, etape.code);
            }}
          >
            <span
              aria-hidden
              className={cn(
                "h-2 rounded-full",
                i < contact.position ? TEMPERATURES[etape.temperature].plein : "bg-muted",
              )}
            />
            <span>{LIBELLES_ETAPES[etape.code]}</span>
          </Button>
        );
      })}
    </div>
  );
}

function DernierEchange({ contact }: { contact: ContactSuivi }) {
  const jours = contact.joursDepuisDernierEchange;
  return (
    <>
      {contact.dernierEchangeLe === null || jours === null ? (
        <p className="text-muted-foreground">Aucun échange enregistré.</p>
      ) : (
        <p>
          <span className="sr-only">Dernier échange : </span>
          <span className="inline-block font-semibold first-letter:uppercase">
            {jours === 0
              ? "aujourd’hui"
              : jours === 1
                ? "hier"
                : `le ${formaterDateCourte(contact.dernierEchangeLe)}`}
          </span>
        </p>
      )}
      {contact.note && <p>{contact.note}</p>}
    </>
  );
}

function Coordonnees({ contact }: { contact: ContactSuivi }) {
  const lignes = [
    { libelle: "Fonction", valeur: contact.fonction },
    { libelle: "Entreprise", valeur: contact.entreprise },
    { libelle: "E-mail", valeur: contact.email },
    { libelle: "Téléphone", valeur: contact.telephone },
  ];
  return (
    <dl className="grid gap-2.5">
      {lignes.map(({ libelle, valeur }) => (
        <div key={libelle} className="grid grid-cols-3 items-baseline gap-3">
          <dt className="text-sm text-muted-foreground">{libelle}</dt>
          <dd className="col-span-2 min-w-0 wrap-anywhere select-text">
            {valeur ?? <span className="text-muted-foreground italic">Non renseigné</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ConfirmationSuppression({
  contact,
  supprimerAction,
  onAnnule,
}: {
  contact: ContactSuivi;
  supprimerAction: (id: number) => Promise<void>;
  onAnnule: () => void;
}) {
  const [enCours, demarrer] = useTransition();
  return (
    <div className="grid gap-3 rounded-lg bg-destructive/10 p-3 pl-4">
      <p className="font-semibold">Supprimer {contact.nom} ? Cette action est définitive.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={enCours} onClick={onAnnule}>
          Annuler
        </Button>
        <Button
          variant="destructive"
          disabled={enCours}
          onClick={() => demarrer(() => supprimerAction(contact.id))}
        >
          Confirmer la suppression
        </Button>
      </div>
    </div>
  );
}

/** Relance due : la fiche permet de l'enregistrer comme faite. */
function RelanceDue({
  contact,
  datesRapides,
  marquerAction,
}: {
  contact: ContactSuivi;
  datesRapides: readonly DateRapide[];
  marquerAction: ActionsContact["marquer"];
}) {
  const retard = contact.retardRelance ?? 0;
  return (
    <div className="grid gap-3">
      <p className="font-semibold">
        {retard > 0
          ? `En retard de ${retard} ${retard > 1 ? "jours" : "jour"}`
          : "À relancer aujourd’hui"}
      </p>
      <MarquerRelance id={contact.id} marquerAction={marquerAction} datesRapides={datesRapides} />
    </div>
  );
}

function ContenuFiche({
  contact,
  etapes,
  datesRapides,
  actions,
  deplacer,
}: {
  contact: ContactSuivi;
  etapes: readonly EtapeDuParcours[];
  datesRapides: readonly DateRapide[];
  actions: ActionsContact;
  deplacer: (id: number, etape: Etape) => void;
}) {
  const due = contact.retardRelance !== null && contact.retardRelance >= 0;
  const [mode, setMode] = useState<"suivi" | "fiche" | "suppression">("suivi");
  const sousTitre = [contact.fonction, contact.entreprise].filter(Boolean).join(", ");

  return (
    <>
      <SheetHeader className="flex-row items-center gap-3.5 border-b px-5 py-4">
        <Avatar nom={contact.nom} temperature={contact.temperature} className="size-12 text-base" />
        <div className="min-w-0 flex-1">
          <SheetTitle className="text-xl font-bold tracking-tight wrap-anywhere">{contact.nom}</SheetTitle>
          {sousTitre && <SheetDescription>{sousTitre}</SheetDescription>}
        </div>
        <SheetClose render={<Button variant="ghost" size="icon" aria-label="Fermer la fiche" />}>
          <XIcon />
        </SheetClose>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 text-base">
        <Bloc titre="Étape" action={<Pastille temperature={contact.temperature} />}>
          <PisteCliquable contact={contact} etapes={etapes} deplacer={deplacer} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Étape {contact.position} sur {etapes.length}
            </p>
            {contact.suivante && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => contact.suivante && deplacer(contact.id, contact.suivante)}
              >
                Passer à « {LIBELLES_ETAPES[contact.suivante]} »
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            )}
          </div>
        </Bloc>

        <Bloc titre="Relance">
          {due && (
            <RelanceDue
              contact={contact}
              datesRapides={datesRapides}
              marquerAction={actions.marquer}
            />
          )}
          <RelanceContact
            contact={contact}
            planifierAction={actions.planifierRelance}
            retirerAction={actions.retirerRelance}
            datesRapides={due ? [] : datesRapides}
          />
        </Bloc>

        <Bloc titre="Dernier échange">
          <DernierEchange contact={contact} />
        </Bloc>

        <Bloc
          titre="Coordonnées"
          action={
            mode !== "fiche" && (
              <Button variant="ghost" size="sm" onClick={() => setMode("fiche")}>
                <PencilIcon data-icon="inline-start" />
                Modifier
              </Button>
            )
          }
        >
          {mode === "fiche" ? (
            <FicheContact
              contact={contact}
              modifierAction={actions.modifier}
              onEnregistre={() => setMode("suivi")}
              onAnnule={() => setMode("suivi")}
            />
          ) : (
            <Coordonnees contact={contact} />
          )}
        </Bloc>

        <div className="pt-5">
          {mode === "suppression" ? (
            <ConfirmationSuppression
              contact={contact}
              supprimerAction={actions.supprimer}
              onAnnule={() => setMode("suivi")}
            />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setMode("suppression")}
            >
              <Trash2Icon data-icon="inline-start" />
              Supprimer le contact
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

/** Fiche d'un contact, ouverte dans un tiroir à droite du tableau. */
export function FicheTiroir({
  contact,
  ouvert = contact !== null,
  etapes,
  datesRapides = [],
  actions,
  deplacer,
  onFerme,
}: {
  /** Le contact affiché ; il reste fourni pendant l'animation de fermeture. */
  contact: ContactSuivi | null;
  ouvert?: boolean;
  etapes: readonly EtapeDuParcours[];
  datesRapides?: readonly DateRapide[];
  actions: ActionsContact;
  deplacer: (id: number, etape: Etape) => void;
  onFerme: () => void;
}) {
  return (
    <Sheet
      open={ouvert && contact !== null}
      onOpenChange={(estOuvert) => {
        if (!estOuvert) onFerme();
      }}
    >
      {contact && (
        <SheetContent side="right" showCloseButton={false} className="gap-0">
          <ContenuFiche
            key={contact.id}
            contact={contact}
            etapes={etapes}
            datesRapides={datesRapides}
            actions={actions}
            deplacer={deplacer}
          />
        </SheetContent>
      )}
    </Sheet>
  );
}
