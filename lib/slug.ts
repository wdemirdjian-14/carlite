/** Identifiant d'URL propre : minuscules, sans accents, tirets, 80 caractères maximum (coupé sur un mot). */
export function cleanSlug(input: string, max = 80): string {
  const s = (input ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return (cut.includes('-') ? cut.slice(0, cut.lastIndexOf('-')) : cut).replace(/-+$/g, '');
}
