import type { Metadata } from "next";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeSwitch } from "@/components/theme-switch";
import { cn } from "@/lib/utils";

import {
  ExempleTiroir,
  ExemplesCartes,
  ExemplesGlisser,
  ExemplesRelance,
} from "./exemples-tableau";

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false },
};

// Les classes sont écrites en entier pour que Tailwind les détecte.
const couleurs = [
  { nom: "Brume", token: "background", className: "bg-background" },
  { nom: "Sapin nuit", token: "foreground", className: "bg-foreground" },
  { nom: "Carte", token: "card", className: "bg-card" },
  { nom: "Sapin", token: "primary", className: "bg-primary" },
  { nom: "Sapin clair", token: "secondary", className: "bg-secondary" },
  { nom: "Sourdine", token: "muted", className: "bg-muted" },
  { nom: "Texte secondaire", token: "muted-foreground", className: "bg-muted-foreground" },
  { nom: "Survol", token: "accent", className: "bg-accent" },
  { nom: "Erreur", token: "destructive", className: "bg-destructive" },
  { nom: "Bordure", token: "border", className: "bg-border" },
  { nom: "Bordure de champ", token: "input", className: "bg-input" },
  { nom: "Focus", token: "ring", className: "bg-ring" },
  { nom: "Colonne", token: "colonne", className: "bg-colonne" },
  { nom: "Bord appuyé", token: "bord-fort", className: "bg-bord-fort" },
];

const temperatures = [
  { nom: "Froid", token: "froid", className: "bg-froid", detail: "À contacter, premier échange" },
  { nom: "Tiède", token: "tiede", className: "bg-tiede", detail: "Démo planifiée" },
  { nom: "Chaud", token: "chaud", className: "bg-chaud", detail: "Proposition envoyée" },
  { nom: "Signé", token: "primary", className: "bg-primary", detail: "Gagné" },
];

const etapes = [
  { value: "a-contacter", label: "À contacter", couleur: "bg-froid" },
  { value: "premier-echange", label: "Premier échange", couleur: "bg-froid" },
  { value: "demo", label: "Démo planifiée", couleur: "bg-tiede" },
  { value: "proposition", label: "Proposition envoyée", couleur: "bg-chaud" },
  { value: "gagne", label: "Gagné", couleur: "bg-primary" },
];

const typographie = [
  { role: "Titre de page", classes: "text-3xl font-bold tracking-tight", exemple: "Qui relancer aujourd’hui" },
  { role: "Titre de section", classes: "text-xl font-bold tracking-tight", exemple: "Contacts tièdes" },
  {
    role: "Corps",
    classes: "text-base",
    exemple: "Trois contacts attendent une réponse. Commencez par ceux dont la proposition date de plus d’une semaine.",
  },
  { role: "Secondaire", classes: "text-sm text-muted-foreground", exemple: "Dernier échange le 4 novembre" },
];

function Section({
  titre,
  description,
  children,
}: {
  titre: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold tracking-tight">{titre}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Pastille({
  nom,
  token,
  className,
  detail,
}: {
  nom: string;
  token: string;
  className: string;
  detail?: string;
}) {
  return (
    <li>
      <div className={cn("h-14 rounded-lg ring-1 ring-foreground/10 ring-inset", className)} />
      <p className="mt-2 text-sm font-semibold">{nom}</p>
      <p className="font-mono text-xs text-muted-foreground">{token}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </li>
  );
}

function Piste({ etape }: { etape: number }) {
  return (
    <div
      role="img"
      aria-label={`Étape ${etape} sur ${etapes.length}`}
      className="grid grid-cols-5 gap-1"
    >
      {etapes.map((e, i) => (
        <span key={e.value} className={cn("h-2 rounded-full", i < etape ? e.couleur : "bg-muted")} />
      ))}
    </div>
  );
}

function SousTitre({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>;
}

export default function DesignSystem() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-12 pb-28 sm:px-6 sm:pt-16">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Design system</h1>
        <p className="mt-2 text-muted-foreground">
          Température : chaque contact a une température, du froid au signé. Tout ce qui suit lit
          les tokens du thème. Le sélecteur en bas à droite bascule entre clair, sombre et le
          réglage du système.
        </p>
      </header>

      <ThemeSwitch className="fixed right-4 bottom-4 z-10 shadow-lg" />

      <Section
        titre="Couleurs"
        description="Tokens shadcn définis dans src/app/globals.css, utilisables en bg-*, text-*, border-*."
      >
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {couleurs.map((c) => (
            <Pastille key={c.token} {...c} />
          ))}
        </ul>
      </Section>

      <Section
        titre="Températures"
        description="Chaque étape a une température. Couleur pleine pour les pastilles et la piste, teinte à 15 % pour les fonds."
      >
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
          {temperatures.map((t) => (
            <Pastille key={t.nom} {...t} />
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-2">
          <Badge variant="froid" size="lg">
            <span className="size-2 rounded-full bg-froid" />
            Froid
          </Badge>
          <Badge variant="tiede" size="lg">
            <span className="size-2 rounded-full bg-tiede" />
            Tiède
          </Badge>
          <Badge variant="chaud" size="lg">
            <span className="size-2 rounded-full bg-chaud" />
            Chaud
          </Badge>
          <Badge size="lg">Gagné</Badge>
        </div>
        <ol className="mt-8 grid max-w-md gap-4">
          {etapes.map((e, i) => (
            <li key={e.value} className="grid gap-1.5">
              <span className="text-sm">{e.label}</span>
              <Piste etape={i + 1} />
            </li>
          ))}
        </ol>
      </Section>

      <Section titre="Typographie" description="Figtree pour tout. Les titres sont en gras, avec une approche resserrée.">
        <dl className="divide-y">
          {typographie.map((t) => (
            <div key={t.role} className="grid gap-1 py-4 sm:grid-cols-4 sm:gap-6">
              <dt>
                <span className="block text-sm font-semibold">{t.role}</span>
                <code className="font-mono text-xs text-muted-foreground">{t.classes}</code>
              </dt>
              <dd className={cn("sm:col-span-3", t.classes)}>{t.exemple}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section titre="Boutons" description="Pilules, 40 px de haut par défaut.">
        <div className="grid gap-8">
          <div className="grid gap-3">
            <SousTitre>Variantes</SousTitre>
            <div className="flex flex-wrap items-center gap-2">
              <Button>Ajouter un contact</Button>
              <Button variant="secondary">Planifier la relance</Button>
              <Button variant="outline">Exporter</Button>
              <Button variant="ghost">Annuler</Button>
              <Button variant="destructive">Supprimer</Button>
              <Button variant="link">Voir la fiche</Button>
            </div>
          </div>
          <div className="grid gap-3">
            <SousTitre>Tailles</SousTitre>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs">Très petit</Button>
              <Button size="sm">Petit</Button>
              <Button>Normal</Button>
              <Button size="lg">Grand</Button>
              <Button size="icon" aria-label="Ajouter un contact">
                <PlusIcon />
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            <SousTitre>Avec icône et désactivé</SousTitre>
            <div className="flex flex-wrap items-center gap-2">
              <Button>
                <PlusIcon data-icon="inline-start" />
                Ajouter un contact
              </Button>
              <Button disabled>Enregistrer</Button>
            </div>
          </div>
        </div>
      </Section>

      <Section titre="Champs" description="44 px de haut, fond carte, halo vert au focus.">
        <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
          <div className="grid content-start gap-2">
            <Label htmlFor="ds-nom">Nom</Label>
            <Input id="ds-nom" defaultValue="Claire Vasseur" />
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor="ds-entreprise">Entreprise</Label>
            <Input id="ds-entreprise" placeholder="Nom de l’entreprise" />
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor="ds-etape">Étape</Label>
            <Select items={etapes} defaultValue="demo">
              <SelectTrigger id="ds-etape" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {etapes.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor="ds-relance">Date de relance</Label>
            <Input
              id="ds-relance"
              type="date"
              defaultValue="2026-11-12"
              aria-invalid
              aria-describedby="ds-relance-erreur"
            />
            <p id="ds-relance-erreur" className="text-sm text-destructive">
              La relance doit tomber aujourd’hui ou plus tard.
            </p>
          </div>
        </div>
      </Section>

      <Section
        titre="Carte de contact"
        description="Compacte : qui, quelle entreprise, quand relancer. Le reste est dans la fiche. L’état de la relance se lit à la forme et à la couleur de la pastille."
      >
        <ExemplesCartes />
      </Section>

      <Section
        titre="Tableau et glisser-déposer"
        description="Une colonne par étape, sur fond colonne. Au clavier, Maj + flèche droite ou gauche sur le nom change l’étape."
      >
        <ExemplesGlisser />
      </Section>

      <Section
        titre="Relancer"
        description="Dates rapides et progression du jour, dans la fiche et sur la page « Aujourd’hui »."
      >
        <ExemplesRelance />
      </Section>

      <Section
        titre="Tiroir"
        description="Sheet de shadcn (Base UI Dialog), ouvert à droite, pleine largeur sur téléphone. Il porte la fiche du contact."
      >
        <ExempleTiroir />
      </Section>
    </main>
  );
}
