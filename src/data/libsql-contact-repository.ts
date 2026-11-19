import type { Contact, ContactRepository, DateCalendrier, Etape } from "./contact-repository";
import type { Db, Ligne } from "./db";

/** Colonnes lues pour reconstruire un `Contact` : une constante, jamais une valeur saisie. */
const COLONNES = "id, nom, entreprise, etape, relance_le, cree_le";

// Requêtes paramétrées : les valeurs passent toujours par `args`.
const SQL = {
  ajouter: `INSERT INTO contacts (nom, entreprise, etape, cree_le) VALUES (?, ?, ?, ?) RETURNING ${COLONNES}`,
  lister: `SELECT ${COLONNES} FROM contacts`,
  trouver: `SELECT ${COLONNES} FROM contacts WHERE id = ?`,
  changerEtape: `UPDATE contacts SET etape = ? WHERE id = ? RETURNING ${COLONNES}`,
  changerRelance: `UPDATE contacts SET relance_le = ? WHERE id = ? RETURNING ${COLONNES}`,
};

function texteOuNull(valeur: Ligne[string]): string | null {
  return valeur === null ? null : String(valeur);
}

/** `cree_le` est stocké en millisecondes depuis l'epoch, `relance_le` en AAAA-MM-JJ. */
function versContact(ligne: Ligne): Contact {
  return {
    id: Number(ligne.id),
    nom: String(ligne.nom),
    entreprise: texteOuNull(ligne.entreprise),
    // Seul le service écrit l'étape : la colonne ne contient que des valeurs de `Etape`.
    etape: String(ligne.etape) as Etape,
    relanceLe: texteOuNull(ligne.relance_le) as DateCalendrier | null,
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
  };
}
