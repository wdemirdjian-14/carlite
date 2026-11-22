// Centralized pricing helpers. Stored prices are treated as HT (hors taxes).
// French standard VAT rate.
export const TVA_RATE = 0.20;

export function formatEuro(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('fr-FR');
}

export function htToTtc(ht: number | null | undefined): number {
  return Math.round((ht ?? 0) * (1 + TVA_RATE));
}

export function euroHT(n: number | null | undefined): string {
  return `${formatEuro(n)} € HT`;
}

export function euroTTC(n: number | null | undefined): string {
  return `${formatEuro(htToTtc(n))} € TTC`;
}
