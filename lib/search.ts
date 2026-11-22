// Outils de recherche plein texte côté client : insensible aux accents, à la casse et à la ponctuation.

export function normalize(s: string | null | undefined): string {
  return (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9.,/+\- ]+/g, ' ')
    .replace(/\s+/g, ' ')
    // « 48 V », « 105 Ah », « 3000 W » -> « 48v », « 105ah », « 3000w » (la requête est normalisée pareil)
    .replace(/(\d)\s(v|w|kw|kwh|ah|a|mm|cm|m|lm)\b/g, '$1$2')
    .trim();
}

// Mots trop courants pour être discriminants
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'pour', 'avec', 'et', 'a', 'en', 'au', 'aux', 'd', 'l']);

export function tokenize(q: string): string[] {
  return normalize(q)
    .split(' ')
    .map((t) => t.replace(/^[.,/+\-]+|[.,/+\-]+$/g, ''))
    .filter((t) => t && !STOP.has(t));
}

/**
 * Score de pertinence : chaque mot de la requête doit être trouvé (préfixe de mot ou sous-chaîne)
 * dans au moins un champ. Les champs sont pondérés (titre > catégorie > description).
 * Renvoie 0 si un mot est introuvable.
 */
export function scoreText(tokens: string[], fields: { text: string; weight: number }[]): number {
  if (!tokens.length) return 1;
  let total = 0;
  for (const t of tokens) {
    let best = 0;
    for (const f of fields) {
      if (!f.text) continue;
      const idx = f.text.indexOf(t);
      if (idx === -1) continue;
      const wordStart = idx === 0 || f.text[idx - 1] === ' ';
      const s = f.weight * (idx === 0 ? 3 : wordStart ? 2 : 1);
      if (s > best) best = s;
    }
    if (!best) return 0;
    total += best;
  }
  return total;
}
