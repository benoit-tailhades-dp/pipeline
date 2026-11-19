"use client";

import { useState } from "react";

import { CarteContact } from "@/components/contacts/carte-contact";
import { DatesRapides } from "@/components/contacts/dates-rapides";
import { ProgressionDuJour } from "@/components/contacts/progression-du-jour";
import { useToast } from "@/components/toasts";
import { EnTeteColonne } from "@/components/contacts/tableau-contacts";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ColonneDuTableau, ContactSuivi, DateRapide } from "@/services/contact-service";

// Exemples figés au 18 novembre 2026, comme dans LOTS.md.
const claire: ContactSuivi = {
  id: 1,
  nom: "Claire Vasseur",
  entreprise: "Ateliers Vernier",
  fonction: "Responsable PLM",
  email: null,
  telephone: null,
  etape: "demo",
  temperature: "tiede",
  position: 3,
  suivante: "proposition",
  relanceLe: "2026-11-18",
  retardRelance: 0,
  dernierEchangeLe: "2026-11-04",
  joursDepuisDernierEchange: 14,
  note: "Veut migrer ses nomenclatures avant l’audit de juin.",
  creeLe: new Date("2026-10-01T09:00:00.000Z"),
};

const cartes: { titre: string; contact: ContactSuivi }[] = [
  { titre: "Relance du jour", contact: claire },
  {
    titre: "Relance en retard",
    contact: {
      ...claire,
      id: 2,
      nom: "Julien Marchetti",
      entreprise: "Forges de Lussac",
      etape: "proposition",
      temperature: "chaud",
      position: 4,
      suivante: "gagne",
      relanceLe: "2026-11-15",
      retardRelance: 3,
      note: "Attend l’arbitrage du budget 2027.",
    },
  },
  {
    titre: "Relance planifiée",
    contact: {
      ...claire,
      id: 3,
      nom: "Nadia Benali",
      entreprise: "Aéro Composites Sud",
      relanceLe: "2026-11-24",
      retardRelance: -6,
      joursDepuisDernierEchange: 1,
      note: null,
    },
  },
  {
    titre: "Sans relance : à surveiller",
    contact: {
      ...claire,
      id: 4,
      nom: "Karim Haddad",
      entreprise: "Électro Bressan",
      etape: "premier-echange",
      temperature: "froid",
      position: 2,
      suivante: "demo",
      relanceLe: null,
      retardRelance: null,
      note: null,
    },
  },
  {
    titre: "Signé",
    contact: {
      ...claire,
      id: 5,
      nom: "Isabelle Roche",
      entreprise: "Groupe Valmont",
      etape: "gagne",
      temperature: "signe",
      position: 5,
      suivante: null,
      relanceLe: null,
      retardRelance: null,
      joursDepuisDernierEchange: 8,
      note: null,
    },
  },
];

const colonnes: ColonneDuTableau[] = [
  { code: "a-contacter", temperature: "froid", contacts: [] },
  { code: "premier-echange", temperature: "froid", contacts: [] },
  { code: "demo", temperature: "tiede", contacts: [claire, claire] },
  { code: "proposition", temperature: "chaud", contacts: [] },
  { code: "gagne", temperature: "signe", contacts: [] },
];

const datesRapides: DateRapide[] = [
  { code: "demain", date: "2026-11-19" },
  { code: "3-jours", date: "2026-11-21" },
  { code: "1-semaine", date: "2026-11-25" },
  { code: "2-semaines", date: "2026-12-02" },
];

const rien = () => {};

export function ExemplesRelance() {
  const [choisie, setChoisie] = useState<string | null>("2026-11-25");
  return (
    <div className="grid max-w-xl gap-8">
      <figure className="grid gap-2">
        <DatesRapides dates={datesRapides} choisie={choisie} onChoisir={setChoisie} />
        <figcaption className="text-sm text-muted-foreground">
          Dates rapides : le jour réel sous chaque choix. En sélection, la date retenue est
          cerclée de sapin ; ailleurs, un clic planifie directement.
        </figcaption>
      </figure>
      <figure className="grid gap-2">
        <ProgressionDuJour faites={2} total={5} />
        <figcaption className="text-sm text-muted-foreground">
          Progression du jour : un segment par relance, en piste.
        </figcaption>
      </figure>
    </div>
  );
}

export function ExemplesCartes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cartes.map(({ titre, contact }) => (
        <figure key={contact.id} className="grid content-start gap-2">
          <div className="rounded-2xl bg-colonne p-2">
            <CarteContact contact={contact} onOuvrir={rien} onAvancer={rien} onDeplacer={rien} />
          </div>
          <figcaption className="text-sm text-muted-foreground">{titre}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function ExemplesGlisser() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <figure className="grid content-start gap-2">
        <div className="rounded-2xl bg-colonne">
          <EnTeteColonne colonne={colonnes[2]} rang={2} colonnes={colonnes} />
          <div className="px-2 pb-3">
            <CarteContact contact={claire} onOuvrir={rien} onAvancer={rien} onDeplacer={rien} />
          </div>
        </div>
        <figcaption className="text-sm text-muted-foreground">
          Colonne au repos : point de température, nombre de contacts, repère dans le parcours.
        </figcaption>
      </figure>
      <figure className="grid content-start gap-2">
        <div className="rounded-2xl bg-colonne p-4">
          <CarteContact
            contact={claire}
            className="scale-103 rotate-2 border-bord-fort shadow-xl"
            onOuvrir={rien}
            onAvancer={rien}
            onDeplacer={rien}
          />
        </div>
        <figcaption className="text-sm text-muted-foreground">
          Carte en main : inclinée, agrandie, ombre portée. Sa place d’origine passe à 40 %.
        </figcaption>
      </figure>
      <figure className="grid content-start gap-2">
        <div className="rounded-2xl bg-chaud/10 outline-2 -outline-offset-2 outline-chaud/60">
          <EnTeteColonne colonne={colonnes[3]} rang={3} colonnes={colonnes} />
          <div className="px-2 pb-3">
            <div className="h-24 rounded-xl border-2 border-dashed border-chaud/60 bg-chaud/10" />
          </div>
        </div>
        <figcaption className="text-sm text-muted-foreground">
          Colonne visée : teinte et contour de sa température, emplacement en pointillés.
        </figcaption>
      </figure>
    </div>
  );
}

export function ExempleToast() {
  const afficherToast = useToast();
  return (
    <Button
      variant="outline"
      onClick={() =>
        afficherToast("Claire Vasseur passe à « Proposition envoyée ».", () =>
          afficherToast("Déplacement annulé."),
        )
      }
    >
      Afficher un toast
    </Button>
  );
}

export function ExempleTiroir() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>Ouvrir un tiroir</SheetTrigger>
      <SheetContent>
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-xl font-bold tracking-tight">Claire Vasseur</SheetTitle>
          <SheetDescription>Responsable PLM, Ateliers Vernier</SheetDescription>
        </SheetHeader>
        <p className="px-5 text-base">
          Le tiroir porte la fiche d’un contact : étape, relance, dernier échange, coordonnées.
        </p>
      </SheetContent>
    </Sheet>
  );
}
