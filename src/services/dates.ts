/**
 * Dates du calendrier (AAAA-MM-JJ). Elles se comparent comme des chaînes :
 * `"2026-11-17" < "2026-11-18"`.
 */

/** La date du calendrier qu'affiche une horloge du fuseau à cet instant. */
export function dateDuJour(instant: Date, fuseau: string): string {
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const partie = (type: Intl.DateTimeFormatPartTypes) =>
    parties.find((p) => p.type === type)?.value ?? "";
  return `${partie("year")}-${partie("month")}-${partie("day")}`;
}

/** Vrai pour une date AAAA-MM-JJ qui existe au calendrier (pas de 30 février). */
export function estUneDate(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(valeur);
}

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Nombre de jours de `de` à `a`, négatif si `a` tombe avant. Calculé en UTC : pas d'heure d'été. */
export function joursEntre(de: string, a: string): number {
  return Math.round((Date.parse(`${a}T00:00:00.000Z`) - Date.parse(`${de}T00:00:00.000Z`)) / MS_PAR_JOUR);
}
