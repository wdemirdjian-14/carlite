// Listing produits (pièces détachées) : export Excel/CSV et import des quantités, prix d'achat et prix de vente.
// Utilisé uniquement côté serveur par les routes /api/admin/products/*.
import ExcelJS from 'exceljs';
import { parse as parseCsv } from 'csv/sync';
import { normalize } from '@/lib/search';
import { siteUrl } from '@/lib/seo';
import { htToTtc } from '@/lib/pricing';

export const STOCK_LABEL: Record<string, string> = {
  available: 'Disponible',
  restocking: 'Réapprovisionnement',
  out_of_stock: 'Rupture',
};

/** Colonnes du fichier. `edit` = valeur relue à l'import ; les autres sont informatives. */
export const COLUMNS = [
  { key: 'id', header: 'ID (ne pas modifier)', width: 28, edit: false },
  { key: 'name', header: 'Nom', width: 50, edit: false },
  { key: 'category', header: 'Catégorie', width: 22, edit: false },
  { key: 'published', header: 'Publié', width: 9, edit: false },
  { key: 'quantity', header: 'Quantité', width: 11, edit: true },
  { key: 'purchasePrice', header: "Prix d'achat HT", width: 15, edit: true },
  { key: 'price', header: 'Prix de vente HT', width: 16, edit: true },
  { key: 'priceTtc', header: 'Prix de vente TTC (calculé)', width: 16, edit: false },
  { key: 'margin', header: 'Marge HT (calculée)', width: 15, edit: false },
  { key: 'stockStatus', header: 'Statut stock', width: 20, edit: true },
  { key: 'link', header: 'Lien fiche', width: 45, edit: false },
] as const;

type Product = { id: string; name: string; slug: string; category: string; published: boolean; quantity: number; purchasePrice: number | null; price: number; stockStatus: string };

const fmtCsvNumber = (n: number | null | undefined) => (n == null ? '' : String(Math.round(n * 100) / 100).replace('.', ','));

export async function buildXlsx(products: Product[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'CARLITE';
  const ws = wb.addWorksheet('Produits', { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] });
  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  products.forEach((p, i) => {
    const r = i + 2;
    ws.addRow({
      id: p.id,
      name: p.name,
      category: p.category || '',
      published: p.published ? 'oui' : 'non',
      quantity: p.quantity ?? 0,
      purchasePrice: p.purchasePrice ?? null,
      price: p.price ?? 0,
      priceTtc: { formula: `ROUND(G${r}*1.2,2)`, result: htToTtc(p.price) },
      margin: { formula: `IF(OR(F${r}="",G${r}=0),"",G${r}-F${r})`, result: p.purchasePrice && p.price ? p.price - p.purchasePrice : '' },
      stockStatus: STOCK_LABEL[p.stockStatus] ?? 'Disponible',
      link: { text: 'Voir', hyperlink: siteUrl(`/accessoires/${encodeURIComponent(p.slug)}`) },
    });
  });
  // Mise en forme : en-tête, colonnes modifiables surlignées, formats monétaires
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.height = 30;
  header.alignment = { vertical: 'middle', wrapText: true };
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.edit ? 'FF4D7C0F' : 'FF0B1020' } };
    const col = ws.getColumn(i + 1);
    if (['purchasePrice', 'price', 'priceTtc', 'margin'].includes(c.key)) col.numFmt = '#,##0.00 "€"';
    if (c.edit) {
      for (let r = 2; r <= products.length + 1; r++) ws.getCell(r, i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2FBD9' } };
    }
  });
  const statusCol = COLUMNS.findIndex((c) => c.key === 'stockStatus') + 1;
  for (let r = 2; r <= products.length + 1; r++) {
    ws.getCell(r, statusCol).dataValidation = { type: 'list', allowBlank: true, formulae: ['"Disponible,Réapprovisionnement,Rupture"'] };
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const help = wb.addWorksheet('Mode d’emploi');
  help.getColumn(1).width = 110;
  [
    'Modifiez uniquement les colonnes vertes : Quantité, Prix d’achat HT, Prix de vente HT, Statut stock.',
    'Ne modifiez pas la colonne ID : elle identifie le produit. Les lignes sans ID ou avec un ID inconnu sont ignorées.',
    'Une cellule laissée vide = valeur inchangée. Prix de vente 0 = « Sur devis » sur le site. Prix d’achat 0 = effacé.',
    'Quantité modifiée sans changer le statut : le statut passe à « Disponible » si quantité > 0, « Rupture » si 0.',
    'Le prix d’achat et la marge sont privés : ils ne sont jamais affichés sur le site public.',
    'Importez ensuite le fichier dans Admin → Import / export : un aperçu des changements s’affiche avant validation.',
    'Chaque import est enregistré dans l’historique et peut être annulé.',
  ].forEach((t, i) => (help.getCell(i + 1, 1).value = `${i + 1}. ${t}`));

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export function buildCsv(products: Product[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [COLUMNS.map((c) => c.header).join(';')];
  for (const p of products) {
    lines.push(
      [
        p.id,
        p.name,
        p.category || '',
        p.published ? 'oui' : 'non',
        p.quantity ?? 0,
        fmtCsvNumber(p.purchasePrice),
        fmtCsvNumber(p.price),
        fmtCsvNumber(htToTtc(p.price)),
        p.purchasePrice && p.price ? fmtCsvNumber(p.price - p.purchasePrice) : '',
        STOCK_LABEL[p.stockStatus] ?? 'Disponible',
        siteUrl(`/accessoires/${encodeURIComponent(p.slug)}`),
      ]
        .map(esc)
        .join(';')
    );
  }
  // BOM UTF-8 : Excel affiche correctement les accents
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// ---------------------------------------------------------------------------
// Lecture d'un fichier importé
// ---------------------------------------------------------------------------
type Cell = string | number | null;
type RawRow = { line: number; cells: Record<string, Cell> };

/** Repère les colonnes par leur titre (tolérant : accents, casse, libellés approchants). */
function mapHeader(h: string): string | null {
  const n = normalize(h);
  if (!n) return null;
  if (n.startsWith('id') || n === 'identifiant') return 'id';
  if (n.includes('quantite') || n === 'qte' || n === 'stock') return 'quantity';
  if (n.includes('achat')) return 'purchasePrice';
  if (n.includes('ttc') || n.includes('marge')) return null; // colonnes calculées : ignorées
  if (n.includes('vente') || n === 'prix' || n.startsWith('prix ht')) return 'price';
  if (n.includes('statut') || n.includes('etat')) return 'stockStatus';
  if (n === 'nom' || n.includes('designation')) return 'name';
  return null;
}

function cellValue(v: any): Cell {
  if (v == null) return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (typeof v === 'object') {
    if ('result' in v) return cellValue(v.result);
    if ('text' in v) return String(v.text);
    if ('richText' in v) return v.richText.map((t: any) => t.text).join('');
  }
  return String(v);
}

export async function readSheet(fileName: string, buf: Buffer): Promise<RawRow[]> {
  let table: Cell[][] = [];
  if (/\.xlsx$/i.test(fileName)) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf as any);
    const ws = wb.worksheets.find((w) => w.name === 'Produits') ?? wb.worksheets[0];
    if (!ws) throw new Error('Le fichier Excel ne contient aucune feuille.');
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const vals: Cell[] = [];
      for (let c = 1; c <= ws.columnCount; c++) vals.push(cellValue(row.getCell(c).value));
      table[rowNumber - 1] = vals;
    });
    table = Array.from(table, (r) => r ?? []);
  } else if (/\.csv$/i.test(fileName)) {
    const text = buf.toString('utf8').replace(/^﻿/, '');
    const first = text.split(/\r?\n/)[0] ?? '';
    const delimiter = (first.match(/;/g)?.length ?? 0) >= (first.match(/,/g)?.length ?? 0) ? ';' : ',';
    table = parseCsv(text, { delimiter, relax_column_count: true, skip_empty_lines: false, bom: true });
  } else {
    throw new Error('Format non pris en charge : utilisez le fichier .xlsx ou .csv exporté.');
  }
  if (!table.length) throw new Error('Fichier vide.');
  const keys = (table[0] ?? []).map((h) => mapHeader(String(h ?? '')));
  if (!keys.includes('id')) throw new Error('Colonne « ID » introuvable : partez d’un fichier exporté depuis le site.');
  if (!keys.some((k) => k === 'quantity' || k === 'purchasePrice' || k === 'price' || k === 'stockStatus'))
    throw new Error('Aucune colonne modifiable trouvée (Quantité, Prix d’achat HT, Prix de vente HT, Statut stock).');
  const rows: RawRow[] = [];
  table.slice(1).forEach((r, i) => {
    const cells: Record<string, Cell> = {};
    keys.forEach((k, j) => {
      if (k && !(k in cells)) cells[k] = r?.[j] ?? null;
    });
    if (Object.values(cells).every((v) => v === null || String(v).trim() === '')) return;
    rows.push({ line: i + 2, cells });
  });
  return rows;
}

// ---------------------------------------------------------------------------
// Comparaison avec la base
// ---------------------------------------------------------------------------
export type Values = { quantity: number; purchasePrice: number | null; price: number; stockStatus: string };
export type Change = { id: string; name: string; line: number; before: Values; after: Values; fields: (keyof Values)[] };
export type RowError = { line: number; id?: string; name?: string; message: string };

function parseNumber(v: Cell): number | null | 'invalid' {
  if (v === null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 'invalid';
  const s = String(v).replace(/[\s  €]/g, '').replace(/HT$/i, '');
  if (!s) return null;
  // « 1.299,50 » ou « 1,299.50 » ou « 1299,5 »
  let t = s;
  if (t.includes(',') && t.includes('.')) t = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else t = t.replace(',', '.');
  const n = Number(t);
  return Number.isFinite(n) ? n : 'invalid';
}

function parseStatus(v: Cell): string | null | 'invalid' {
  if (v === null || String(v).trim() === '') return null;
  const n = normalize(String(v));
  if (n.startsWith('dispo') || n === 'en stock' || n === 'available') return 'available';
  if (n.startsWith('reappro') || n.includes('commande') || n === 'restocking') return 'restocking';
  if (n.startsWith('rupture') || n.includes('epuise') || n === 'out of stock' || n === 'out_of_stock') return 'out_of_stock';
  return 'invalid';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeChanges(rows: RawRow[], products: Map<string, Product>) {
  const changes: Change[] = [];
  const errors: RowError[] = [];
  const warnings: RowError[] = [];
  const seen = new Set<string>();
  let unchanged = 0;

  for (const { line, cells } of rows) {
    const id = String(cells.id ?? '').trim();
    const label = cells.name != null ? String(cells.name) : undefined;
    if (!id) {
      errors.push({ line, name: label, message: 'ID manquant : ligne ignorée' });
      continue;
    }
    const p = products.get(id);
    if (!p) {
      errors.push({ line, id, name: label, message: 'ID inconnu (produit supprimé ou ID modifié) : ligne ignorée' });
      continue;
    }
    if (seen.has(id)) {
      errors.push({ line, id, name: p.name, message: 'Produit présent plusieurs fois dans le fichier : seule la première ligne est prise en compte' });
      continue;
    }
    seen.add(id);

    const before: Values = { quantity: p.quantity ?? 0, purchasePrice: p.purchasePrice ?? null, price: p.price ?? 0, stockStatus: p.stockStatus ?? 'available' };
    const after: Values = { ...before };
    const problems: string[] = [];

    if ('quantity' in cells) {
      const q = parseNumber(cells.quantity);
      if (q === 'invalid' || (q !== null && (q < 0 || !Number.isInteger(q)))) problems.push(`quantité invalide « ${cells.quantity} » (nombre entier ≥ 0)`);
      else if (q !== null) after.quantity = q;
    }
    if ('purchasePrice' in cells) {
      const v = parseNumber(cells.purchasePrice);
      if (v === 'invalid' || (v !== null && v < 0)) problems.push(`prix d’achat invalide « ${cells.purchasePrice} »`);
      else if (v !== null) after.purchasePrice = v > 0 ? round2(v) : null;
    }
    if ('price' in cells) {
      const v = parseNumber(cells.price);
      if (v === 'invalid' || (v !== null && v < 0)) problems.push(`prix de vente invalide « ${cells.price} »`);
      else if (v !== null) after.price = round2(v);
    }
    let statusGiven: string | null = null;
    if ('stockStatus' in cells) {
      const s = parseStatus(cells.stockStatus);
      if (s === 'invalid') problems.push(`statut inconnu « ${cells.stockStatus} » (Disponible, Réapprovisionnement ou Rupture)`);
      else statusGiven = s;
    }
    if (problems.length) {
      errors.push({ line, id, name: p.name, message: `Ligne ignorée : ${problems.join(' ; ')}` });
      continue;
    }
    // Statut : un changement explicite prime ; sinon il suit la quantité quand celle-ci change
    if (statusGiven && statusGiven !== before.stockStatus) after.stockStatus = statusGiven;
    else if (after.quantity !== before.quantity) after.stockStatus = after.quantity > 0 ? 'available' : 'out_of_stock';

    const fields = (Object.keys(after) as (keyof Values)[]).filter((k) => after[k] !== before[k]);
    if (!fields.length) {
      unchanged++;
      continue;
    }
    if (after.purchasePrice && after.price > 0 && after.price < after.purchasePrice) {
      warnings.push({ line, id, name: p.name, message: `Prix de vente (${after.price} €) inférieur au prix d’achat (${after.purchasePrice} €)` });
    }
    changes.push({ id, name: p.name, line, before, after, fields });
  }
  return { changes, errors, warnings, unchanged, read: rows.length };
}
