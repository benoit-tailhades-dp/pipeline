"use client";

import { useId, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  ContactSuivi,
  Etape,
  EtapeDuParcours,
  Temperature,
} from "@/services/contact-service";

const LIBELLES_ETAPES: Record<Etape, string> = {
  "a-contacter": "À contacter",
  "premier-echange": "Premier échange",
  demo: "Démo planifiée",
  proposition: "Proposition envoyée",
  gagne: "Gagné",
};

// Classes écrites en entier pour que Tailwind les détecte.
const PASTILLES: Record<
  Temperature,
  { libelle: string; variante: "froid" | "tiede" | "chaud" | "default"; point: string | null }
> = {
  froid: { libelle: "Froid", variante: "froid", point: "bg-froid" },
  tiede: { libelle: "Tiède", variante: "tiede", point: "bg-tiede" },
  chaud: { libelle: "Chaud", variante: "chaud", point: "bg-chaud" },
  signe: { libelle: "Signé", variante: "default", point: null },
};

const COULEURS_PISTE: Record<Temperature, string> = {
  froid: "bg-froid",
  tiede: "bg-tiede",
  chaud: "bg-chaud",
  signe: "bg-primary",
};

function Pastille({ temperature }: { temperature: Temperature }) {
  const { libelle, variante, point } = PASTILLES[temperature];
  return (
    <Badge variant={variante} size="lg">
      {point && <span aria-hidden className={cn("size-2 rounded-full", point)} />}
      {libelle}
    </Badge>
  );
}

function Piste({
  etapes,
  position,
}: {
  etapes: readonly EtapeDuParcours[];
  position: number;
}) {
  return (
    <div
      role="img"
      aria-label={`Étape ${position} sur ${etapes.length}`}
      className="grid grid-cols-5 gap-1"
    >
      {etapes.map((etape, i) => {
        const franchie = i < position;
        return (
          <span
            key={etape.code}
            data-franchie={franchie}
            className={cn(
              "h-2 rounded-full",
              franchie ? COULEURS_PISTE[etape.temperature] : "bg-muted",
            )}
          />
        );
      })}
    </div>
  );
}

export function CarteContact({
  contact,
  etapes,
  avancerAction,
  changerEtapeAction,
}: {
  contact: ContactSuivi;
  etapes: readonly EtapeDuParcours[];
  avancerAction: (id: number) => Promise<void>;
  changerEtapeAction: (id: number, etape: Etape) => Promise<void>;
}) {
  const [enCours, demarrer] = useTransition();
  const idEtape = useId();
  const choix = etapes.map((etape) => ({
    value: etape.code,
    label: LIBELLES_ETAPES[etape.code],
  }));

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle role="heading" aria-level={3} className="text-lg font-bold tracking-tight">
          {contact.nom}
        </CardTitle>
        {contact.entreprise && <CardDescription>{contact.entreprise}</CardDescription>}
        <CardAction className="self-center">
          <Pastille temperature={contact.temperature} />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Piste etapes={etapes} position={contact.position} />
          <p className="text-muted-foreground">
            Étape {contact.position} sur {etapes.length}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-56 flex-1 gap-2">
            <Label htmlFor={idEtape}>Étape</Label>
            <Select
              items={choix}
              value={contact.etape}
              disabled={enCours}
              onValueChange={(etape) => {
                if (etape && etape !== contact.etape) {
                  demarrer(() => changerEtapeAction(contact.id, etape));
                }
              }}
            >
              <SelectTrigger id={idEtape} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {choix.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contact.suivante && (
            <Button
              size="lg"
              disabled={enCours}
              onClick={() => demarrer(() => avancerAction(contact.id))}
            >
              Étape suivante
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
