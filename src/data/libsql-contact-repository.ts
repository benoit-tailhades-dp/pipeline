import type { Contact, ContactRepository, Etape } from "./contact-repository";
import type { Db, Ligne } from "./db";

/** `cree_le` est stocké en millisecondes depuis l'epoch. */
function versContact(ligne: Ligne): Contact {
  return {
    id: Number(ligne.id),
    nom: String(ligne.nom),
    entreprise: ligne.entreprise === null ? null : String(ligne.entreprise),
    // Seul le service écrit l'étape : la colonne ne contient que des valeurs de `Etape`.
    etape: String(ligne.etape) as Etape,
    creeLe: new Date(Number(ligne.cree_le)),
  };
}

export function createLibsqlContactRepository(db: Db): ContactRepository {
  return {
    async ajouter(contact) {
      const resultat = await db.execute({
        sql: "INSERT INTO contacts (nom, entreprise, etape, cree_le) VALUES (?, ?, ?, ?) RETURNING id, nom, entreprise, etape, cree_le",
        args: [contact.nom, contact.entreprise, contact.etape, contact.creeLe.getTime()],
      });
      const ligne = resultat.rows[0];
      if (!ligne) throw new Error("L'ajout du contact n'a renvoyé aucune ligne.");
      return versContact(ligne);
    },

    async lister() {
      const resultat = await db.execute("SELECT id, nom, entreprise, etape, cree_le FROM contacts");
      return resultat.rows.map(versContact);
    },

    async trouver(id) {
      const resultat = await db.execute({
        sql: "SELECT id, nom, entreprise, etape, cree_le FROM contacts WHERE id = ?",
        args: [id],
      });
      const ligne = resultat.rows[0];
      return ligne ? versContact(ligne) : null;
    },

    async changerEtape(id, etape) {
      const resultat = await db.execute({
        sql: "UPDATE contacts SET etape = ? WHERE id = ? RETURNING id, nom, entreprise, etape, cree_le",
        args: [etape, id],
      });
      const ligne = resultat.rows[0];
      return ligne ? versContact(ligne) : null;
    },
  };
}
