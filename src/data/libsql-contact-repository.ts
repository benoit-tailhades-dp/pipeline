import type { Contact, ContactRepository, DateCalendrier, Etape } from "./contact-repository";
import type { Db, Ligne } from "./db";

/** Colonnes lues pour reconstruire un `Contact` : une constante, jamais une valeur saisie. */
const COLONNES = "id, nom, entreprise, etape, relance_le, dernier_echange_le, note, cree_le";

// Requêtes paramétrées : les valeurs passent toujours par `args`.
const SQL = {
  ajouter: `INSERT INTO contacts (nom, entreprise, etape, cree_le) VALUES (?, ?, ?, ?) RETURNING ${COLONNES}`,
  lister: `SELECT ${COLONNES} FROM contacts`,
  trouver: `SELECT ${COLONNES} FROM contacts WHERE id = ?`,
  changerEtape: `UPDATE contacts SET etape = ? WHERE id = ? RETURNING ${COLONNES}`,
  changerRelance: `UPDATE contacts SET relance_le = ? WHERE id = ? RETURNING ${COLONNES}`,
  enregistrerEchange: `UPDATE contacts SET dernier_echange_le = ?, note = ?, relance_le = ? WHERE id = ? RETURNING ${COLONNES}`,
  // Les dates AAAA-MM-JJ se comparent comme des chaînes.
  listerRelancesJusquAu: `SELECT ${COLONNES} FROM contacts WHERE relance_le IS NOT NULL AND relance_le <= ?`,
};

function texteOuNull(valeur: Ligne[string]): string | null {
  return valeur === null ? null : String(valeur);
}

/** `cree_le` est stocké en millisecondes depuis l'epoch, les dates du calendrier en AAAA-MM-JJ. */
function versContact(ligne: Ligne): Contact {
  return {
    id: Number(ligne.id),
    nom: String(ligne.nom),
    entreprise: texteOuNull(ligne.entreprise),
    // Seul le service écrit l'étape : la colonne ne contient que des valeurs de `Etape`.
    etape: String(ligne.etape) as Etape,
    relanceLe: texteOuNull(ligne.relance_le) as DateCalendrier | null,
    dernierEchangeLe: texteOuNull(ligne.dernier_echange_le) as DateCalendrier | null,
    note: texteOuNull(ligne.note),
    creeLe: new Date(Number(ligne.cree_le)),
  };
}

export function createLibsqlContactRepository(db: Db): ContactRepository {
  /** Exécute une requête qui renvoie au plus un contact. */
  async function unContact(sql: string, args: (string | number | null)[]) {
    const resultat = await db.execute({ sql, args });
    const ligne = resultat.rows[0];
    return ligne ? versContact(ligne) : null;
  }

  return {
    async ajouter(contact) {
      const ajoute = await unContact(SQL.ajouter, [
        contact.nom,
        contact.entreprise,
        contact.etape,
        contact.creeLe.getTime(),
      ]);
      if (!ajoute) throw new Error("L'ajout du contact n'a renvoyé aucune ligne.");
      return ajoute;
    },

    async lister() {
      const resultat = await db.execute(SQL.lister);
      return resultat.rows.map(versContact);
    },

    trouver(id) {
      return unContact(SQL.trouver, [id]);
    },

    changerEtape(id, etape) {
      return unContact(SQL.changerEtape, [etape, id]);
    },

    changerRelance(id, date) {
      return unContact(SQL.changerRelance, [date, id]);
    },

    enregistrerEchange(id, echange) {
      return unContact(SQL.enregistrerEchange, [
        echange.dernierEchangeLe,
        echange.note,
        echange.relanceLe,
        id,
      ]);
    },

    async listerRelancesJusquAu(date) {
      const resultat = await db.execute({ sql: SQL.listerRelancesJusquAu, args: [date] });
      return resultat.rows.map(versContact);
    },
  };
}
