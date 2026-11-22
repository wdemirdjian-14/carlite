/**
 * CARLITE — import du contenu du catalogue et remise en ordre des images.
 *
 *   npm run import:contenu            (lit DATABASE_URL dans .env)
 *
 * Deux étapes, toutes deux NON destructives (aucune suppression, aucun écrasement de contenu) :
 *
 * 1. Catalogue : chaque ligne des fichiers prisma/data/*.csv (véhicules, configurateur, pièces
 *    détachées, occasions, promotions, articles) est créée si son identifiant n'existe pas encore.
 *    Une ligne déjà présente en base n'est jamais modifiée : on peut relancer le script sans risque,
 *    y compris après avoir restauré le dump complet de l'ancienne plateforme.
 *
 * 2. Images : toutes les URL d'images de la base qui pointent vers l'ancien hébergement
 *    (bucket S3 / CDN de l'ancienne plateforme) sont réécrites vers /uploads/… (fichiers servis
 *    par le site lui-même), et les photos iPhone .HEIC (illisibles hors Safari) vers leur version
 *    .jpg convertie. Seules les URL changent.
 */
import fs from 'fs';
import path from 'path';
import { parse } from 'csv/sync';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'prisma', 'data');
const PUBLIC_DIR = path.join(ROOT, 'public');

// Ordre d'import : les tables parentes avant leurs enfants
const TABLES = [
  'Vehicle',
  'ConfigCategory',
  'ConfigOption',
  'ConfigRule',
  'VehicleColor',
  'VehicleWheel',
  'VehicleOption',
  'PartCategory',
  'Accessory',
  'UsedVehicle',
  'Promotion',
  'Article',
] as const;

// Champs contenant des URL d'images, par table
const IMAGE_FIELDS: Record<string, { single: string[]; list: string[]; text?: string[] }> = {
  Vehicle: { single: ['imageUrl'], list: ['gallery'] },
  ConfigOption: { single: ['imageUrl'], list: [] },
  VehicleOption: { single: ['imageUrl'], list: [] },
  Accessory: { single: ['imageUrl'], list: ['gallery'] },
  UsedVehicle: { single: ['imageUrl'], list: ['gallery'] },
  Article: { single: ['imageUrl'], list: [], text: ['content'] },
};

// ---------------------------------------------------------------------------
// Réécriture des URL d'images
// ---------------------------------------------------------------------------
let urlMap: Record<string, string> = {};
try {
  urlMap = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'uploads', 'correspondance_urls.json'), 'utf8'));
} catch {
  console.warn('⚠️  public/uploads/correspondance_urls.json introuvable : seule la règle générique sera utilisée.');
}

function localExists(url: string) {
  return url.startsWith('/') && fs.existsSync(path.join(PUBLIC_DIR, decodeURIComponent(url.split('?')[0])));
}

export function fixUrl(url: string | null | undefined): string | null | undefined {
  if (!url) return url;
  let u = url.trim();
  if (urlMap[u]) u = urlMap[u];
  // Règles génériques pour les URL absentes de la table de correspondance
  u = u.replace(/^https?:\/\/abacusai-apps-[^/]+\/\d+\/public\/uploads\//, '/uploads/');
  u = u.replace(/^https?:\/\/cdn\.abacus\.ai\/images\//, '/uploads/cdn/');
  // Photos HEIC converties en JPEG
  if (/\.heic$/i.test(u)) {
    const jpg = u.replace(/\.heic$/i, '.jpg');
    if (!u.startsWith('/') || localExists(jpg)) u = jpg;
  }
  return u;
}

function fixText(text: string) {
  return text
    .replace(/https?:\/\/abacusai-apps-[^/\s"')]+\/\d+\/public\/uploads\/[^\s"')]+/g, (m) => fixUrl(m) as string)
    .replace(/https?:\/\/cdn\.abacus\.ai\/images\/[^\s"')]+/g, (m) => fixUrl(m) as string);
}

// ---------------------------------------------------------------------------
// Conversion CSV (export PostgreSQL) -> types Prisma
// ---------------------------------------------------------------------------
function parsePgArray(raw: string): string[] {
  const s = raw.trim();
  if (!s || s === '{}') return [];
  if (!s.startsWith('{')) return [s];
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  let inQuotes = false;
  for (let i = 1; i < s.length - 1; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '\\') cur += s[++i];
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else if (c === '"') {
      inQuotes = true;
      quoted = true;
    } else if (c === ',') {
      out.push(quoted || cur !== 'NULL' ? cur : '');
      cur = '';
      quoted = false;
    } else cur += c;
  }
  out.push(quoted || cur !== 'NULL' ? cur : '');
  return out.filter((x) => x !== '');
}

function convert(field: Prisma.DMMF.Field, raw: string | undefined): unknown {
  if (raw === undefined) return undefined;
  if (field.isList) return parsePgArray(raw);
  if (raw === '' && !field.isRequired) return null;
  switch (field.type) {
    case 'Boolean':
      return raw === 't' || raw === 'true';
    case 'Int':
      return raw === '' ? 0 : parseInt(raw, 10);
    case 'Float':
      return raw === '' ? 0 : parseFloat(raw);
    case 'DateTime':
      return raw === '' ? undefined : new Date(raw.replace(' ', 'T') + (/[zZ+]/.test(raw.slice(10)) ? '' : 'Z'));
    default:
      return raw;
  }
}

function delegate(model: string): any {
  return (prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
}

async function importTable(model: string) {
  const file = path.join(DATA_DIR, `${model}.csv`);
  if (!fs.existsSync(file)) return { created: 0, existing: 0, skipped: true };
  const rows: Record<string, string>[] = parse(fs.readFileSync(file, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });
  const meta = Prisma.dmmf.datamodel.models.find((m) => m.name === model);
  if (!meta) throw new Error(`Modèle Prisma inconnu : ${model}`);
  const scalar = meta.fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum');
  const imgs = IMAGE_FIELDS[model];

  let created = 0;
  let existing = 0;
  for (const row of rows) {
    const data: Record<string, unknown> = {};
    for (const f of scalar) {
      const v = convert(f, row[f.name]);
      if (v !== undefined) data[f.name] = v;
    }
    if (imgs) {
      for (const k of imgs.single) if (typeof data[k] === 'string') data[k] = fixUrl(data[k] as string);
      for (const k of imgs.list) if (Array.isArray(data[k])) data[k] = (data[k] as string[]).map((u) => fixUrl(u));
      for (const k of imgs.text ?? []) if (typeof data[k] === 'string') data[k] = fixText(data[k] as string);
    }
    const found = await delegate(model).findUnique({ where: { id: data.id as string }, select: { id: true } });
    if (found) {
      existing++;
      continue;
    }
    try {
      await delegate(model).create({ data });
      created++;
    } catch (e: any) {
      // Conflit sur un slug déjà utilisé par une autre ligne : on garde la ligne existante
      if (e?.code === 'P2002' || e?.code === 'P2003') existing++;
      else throw e;
    }
  }
  return { created, existing, skipped: false };
}

async function fixImagesInDatabase() {
  let changed = 0;
  for (const [model, f] of Object.entries(IMAGE_FIELDS)) {
    const select: Record<string, boolean> = { id: true };
    [...f.single, ...f.list, ...(f.text ?? [])].forEach((k) => (select[k] = true));
    const rows: any[] = await delegate(model).findMany({ select });
    for (const r of rows) {
      const data: Record<string, unknown> = {};
      for (const k of f.single) {
        const n = fixUrl(r[k]);
        if (n !== r[k]) data[k] = n;
      }
      for (const k of f.list) {
        const list: string[] = r[k] ?? [];
        const n = list.map((u) => fixUrl(u) as string);
        if (n.some((u, i) => u !== list[i])) data[k] = n;
      }
      for (const k of f.text ?? []) {
        if (typeof r[k] === 'string') {
          const n = fixText(r[k]);
          if (n !== r[k]) data[k] = n;
        }
      }
      if (Object.keys(data).length) {
        await delegate(model).update({ where: { id: r.id }, data });
        changed++;
      }
    }
  }
  return changed;
}

async function main() {
  console.log('== Import du catalogue CARLITE (création des lignes manquantes uniquement)');
  for (const t of TABLES) {
    const r = await importTable(t);
    if (r.skipped) console.log(`   ${t.padEnd(16)} (pas de fichier CSV)`);
    else console.log(`   ${t.padEnd(16)} ${String(r.created).padStart(4)} créé(s), ${String(r.existing).padStart(4)} déjà présent(s)`);
  }
  console.log('== Réécriture des URL d’images vers /uploads/…');
  const changed = await fixImagesInDatabase();
  console.log(`   ${changed} ligne(s) mise(s) à jour`);

  // Contrôle : images référencées introuvables sur le disque
  const missing: string[] = [];
  for (const [model, f] of Object.entries(IMAGE_FIELDS)) {
    const rows: any[] = await delegate(model).findMany();
    for (const r of rows)
      for (const u of [...f.single.map((k) => r[k]), ...f.list.flatMap((k) => r[k] ?? [])])
        if (typeof u === 'string' && u.startsWith('/') && !u.startsWith('/media/') && !localExists(u)) missing.push(`${model} « ${r.name ?? r.title ?? r.id} » : ${u}`);
  }
  if (missing.length) {
    console.log(`⚠️  ${missing.length} image(s) introuvable(s) dans public/ :`);
    missing.slice(0, 20).forEach((m) => console.log('   - ' + m));
  } else console.log('== Toutes les images référencées sont présentes ✔');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
