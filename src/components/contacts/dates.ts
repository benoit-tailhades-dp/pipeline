const dateCourte = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** « 24 nov. » pour `2026-11-24`. La date est lue en UTC pour ne jamais glisser d'un jour. */
export function formaterDateCourte(date: string): string {
  return dateCourte.format(new Date(`${date}T00:00:00.000Z`));
}
