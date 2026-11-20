import type { ContactRepository, Etape } from "./contact-repository";

/** Un contact d'exemple ; les dates sont en jours comptés depuis aujourd'hui. */
interface ContactExemple {
  nom: string;
  entreprise: string;
  fonction: string | null;
  email: string | null;
  telephone: string | null;
  etape: Etape;
  /** Relance : 0 aujourd'hui, négatif en retard, `null` sans relance. */
  relance: number | null;
  /** Dernier échange, en jours avant aujourd'hui ; `null` sans échange. */
  echange: number | null;
  note: string | null;
}

// Données fictives (domaines en .example). 4 relances dues, dont 2 en retard.
const EXEMPLES: readonly ContactExemple[] = [
  { nom: "Claire Vasseur", entreprise: "Ateliers Vernier", fonction: "Responsable PLM", email: "c.vasseur@ateliers-vernier.example", telephone: "06 12 34 56 78", etape: "demo", relance: 0, echange: -14, note: "Veut migrer ses nomenclatures avant l’audit de juin." },
  { nom: "Julien Marchetti", entreprise: "Forges de Lussac", fonction: "DSI", email: "j.marchetti@forges-lussac.example", telephone: "06 41 22 87 10", etape: "proposition", relance: -3, echange: -10, note: "Proposition envoyée, il attend l’arbitrage du budget 2027." },
  { nom: "Sophie Lambert", entreprise: "Hydrel Systèmes", fonction: "Responsable bureau d’études", email: "s.lambert@hydrel.example", telephone: null, etape: "premier-echange", relance: -1, echange: -6, note: "Intéressée par la reprise des modèles SolidWorks dans Windchill." },
  { nom: "Marc Delorme", entreprise: "Cartonnages Merlet", fonction: "Directeur industriel", email: null, telephone: "05 56 78 12 90", etape: "a-contacter", relance: 0, echange: null, note: "Contact donné par Julien Marchetti." },
  { nom: "Nadia Benali", entreprise: "Aéro Composites Sud", fonction: "Cheffe de projet ERP", email: "n.benali@aerocomposites.example", telephone: "06 70 15 33 48", etape: "demo", relance: 3, echange: -2, note: "Démo des connecteurs SAP avec le bureau d’études." },
  { nom: "Thomas Girard", entreprise: "Robotique Alpine", fonction: "Ingénieur méthodes", email: null, telephone: null, etape: "a-contacter", relance: null, echange: null, note: null },
  { nom: "Élodie Ferrand", entreprise: "Textiles Ferrand", fonction: "Directrice des opérations", email: "e.ferrand@textiles-ferrand.example", telephone: null, etape: "premier-echange", relance: 6, echange: -1, note: "Rappeler après le salon Global Industrie." },
  { nom: "Paul Garnier", entreprise: "Moules Garnier", fonction: "Responsable PLM", email: "p.garnier@moules-garnier.example", telephone: "04 72 10 44 61", etape: "proposition", relance: 2, echange: -4, note: "Devis pour 40 000 articles, de Teamcenter vers 3DEXPERIENCE." },
  { nom: "Isabelle Roche", entreprise: "Groupe Valmont", fonction: "DSI", email: "i.roche@valmont.example", telephone: null, etape: "gagne", relance: null, echange: -8, note: "Contrat signé, migration en trois vagues à partir de janvier." },
  { nom: "Karim Haddad", entreprise: "Électro Bressan", fonction: "Responsable qualité", email: "k.haddad@electro-bressan.example", telephone: null, etape: "premier-echange", relance: null, echange: -21, note: "A demandé une référence client dans l’aéronautique." },
  { nom: "Léa Moreau", entreprise: "Optique Darnay", fonction: "Acheteuse", email: null, telephone: null, etape: "a-contacter", relance: 1, echange: null, note: null },
  { nom: "Antoine Pélissier", entreprise: "Menuiseries Pélissier", fonction: "Gérant", email: null, telephone: "02 40 11 98 23", etape: "gagne", relance: null, echange: -30, note: "Projet pilote livré, extension à discuter au deuxième trimestre." },
];

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** `aujourdhui` (AAAA-MM-JJ) décalé de `jours` jours, en UTC : pas d'heure d'été. */
function decaler(aujourdhui: string, jours: number | null): string | null {
  if (jours === null) return null;
  const instant = Date.parse(`${aujourdhui}T00:00:00.000Z`) + jours * MS_PAR_JOUR;
  return new Date(instant).toISOString().slice(0, 10);
}

/**
 * Ajoute les contacts d'exemple, par le repository, et renvoie leur nombre.
 * Les dates suivent `aujourdhui` ; les contacts sont créés un jour d'écart, le dernier à `maintenant`.
 */
export async function semerExemple(
  contacts: ContactRepository,
  aujourdhui: string,
  maintenant: Date,
): Promise<number> {
  for (const [rang, exemple] of EXEMPLES.entries()) {
    const ajoute = await contacts.ajouter({
      nom: exemple.nom,
      entreprise: exemple.entreprise,
      etape: exemple.etape,
      creeLe: new Date(maintenant.getTime() - (EXEMPLES.length - 1 - rang) * MS_PAR_JOUR),
    });
    await contacts.modifier(ajoute.id, {
      nom: exemple.nom,
      entreprise: exemple.entreprise,
      fonction: exemple.fonction,
      email: exemple.email,
      telephone: exemple.telephone,
    });
    await contacts.enregistrerEchange(ajoute.id, {
      dernierEchangeLe: decaler(aujourdhui, exemple.echange),
      note: exemple.note,
      relanceLe: decaler(aujourdhui, exemple.relance),
    });
  }
  return EXEMPLES.length;
}
