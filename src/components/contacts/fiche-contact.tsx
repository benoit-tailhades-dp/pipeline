"use client";

import { useActionState, useId } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactSuivi, ErreursContact } from "@/services/contact-service";

export interface ValeursFiche {
  nom: string;
  entreprise: string;
  fonction: string;
  email: string;
  telephone: string;
}

export interface EtatFiche {
  erreurs?: ErreursContact;
  /** Saisie renvoyée avec une erreur, pour ne pas la perdre au réaffichage. */
  valeurs?: ValeursFiche;
}

function texte(valeur: FormDataEntryValue | null): string {
  return typeof valeur === "string" ? valeur : "";
}

function Champ({
  id,
  nom,
  libelle,
  facultatif = false,
  erreur,
  ...props
}: {
  id: string;
  nom: keyof ValeursFiche;
  libelle: string;
  facultatif?: boolean;
  erreur?: string;
} & Pick<React.ComponentProps<"input">, "type" | "autoComplete" | "defaultValue">) {
  const idErreur = `${id}-erreur`;
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>
        {libelle}
        {facultatif && <span className="font-normal text-muted-foreground"> (facultatif)</span>}
      </Label>
      <Input
        id={id}
        name={nom}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={erreur ? idErreur : undefined}
        {...props}
      />
      {erreur && (
        <p id={idErreur} className="text-sm text-destructive">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function FicheContact({
  contact,
  modifierAction,
  onEnregistre,
  onAnnule,
}: {
  contact: ContactSuivi;
  modifierAction: (id: number, valeurs: ValeursFiche) => Promise<EtatFiche>;
  onEnregistre: () => void;
  onAnnule: () => void;
}) {
  const [etat, envoyer, enCours] = useActionState(async (_etat: EtatFiche, formData: FormData) => {
    const resultat = await modifierAction(contact.id, {
      nom: texte(formData.get("nom")),
      entreprise: texte(formData.get("entreprise")),
      fonction: texte(formData.get("fonction")),
      email: texte(formData.get("email")),
      telephone: texte(formData.get("telephone")),
    });
    if (!resultat.erreurs) onEnregistre();
    return resultat;
  }, {});
  const id = useId();
  const valeurs = etat.valeurs ?? {
    nom: contact.nom,
    entreprise: contact.entreprise ?? "",
    fonction: contact.fonction ?? "",
    email: contact.email ?? "",
    telephone: contact.telephone ?? "",
  };

  return (
    // `noValidate` : c'est le service qui valide l'e-mail et fournit le message.
    <form action={envoyer} noValidate className="grid gap-4 sm:grid-cols-2">
      {etat.erreurs?.contact && (
        <p className="text-sm text-destructive sm:col-span-2">{etat.erreurs.contact}</p>
      )}
      <Champ
        id={`${id}-nom`}
        nom="nom"
        libelle="Nom"
        autoComplete="off"
        defaultValue={valeurs.nom}
        erreur={etat.erreurs?.nom}
      />
      <Champ
        id={`${id}-entreprise`}
        nom="entreprise"
        libelle="Entreprise"
        facultatif
        autoComplete="organization"
        defaultValue={valeurs.entreprise}
        erreur={etat.erreurs?.entreprise}
      />
      <Champ
        id={`${id}-fonction`}
        nom="fonction"
        libelle="Fonction"
        facultatif
        autoComplete="organization-title"
        defaultValue={valeurs.fonction}
        erreur={etat.erreurs?.fonction}
      />
      <Champ
        id={`${id}-email`}
        nom="email"
        libelle="E-mail"
        facultatif
        type="email"
        autoComplete="email"
        defaultValue={valeurs.email}
        erreur={etat.erreurs?.email}
      />
      <Champ
        id={`${id}-telephone`}
        nom="telephone"
        libelle="Téléphone"
        facultatif
        type="tel"
        autoComplete="tel"
        defaultValue={valeurs.telephone}
        erreur={etat.erreurs?.telephone}
      />
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <Button type="submit" disabled={enCours}>
          Enregistrer
        </Button>
        <Button type="button" variant="ghost" disabled={enCours} onClick={onAnnule}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
