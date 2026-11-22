// Lecture du catalogue public (pièces, occasions, véhicules neufs) avec les promotions en cours.
// Point unique pour les règles de visibilité : publié + (en stock, ou rupture mais « garder visible »).
import { prisma } from '@/lib/prisma';
import { getPromoMaps } from '@/lib/promotions';

const VISIBLE = { NOT: { stockStatus: 'out_of_stock', keepVisible: false } };

export function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export async function getVisibleParts() {
  try {
    const [parts, { byAccessory }] = await Promise.all([
      prisma.accessory.findMany({ where: { inStock: true, published: true, ...VISIBLE }, orderBy: { updatedAt: 'desc' } }),
      getPromoMaps(),
    ]);
    return plain(parts.map((p) => ({ ...p, promo: byAccessory[p.id] ?? null })));
  } catch {
    return [];
  }
}

export async function getVisibleUsedVehicles() {
  try {
    const [rows, { byUsed }] = await Promise.all([
      prisma.usedVehicle.findMany({ where: { available: true, published: true, ...VISIBLE }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] }),
      getPromoMaps(),
    ]);
    return plain(rows.map((v) => ({ ...v, promo: byUsed[v.id] ?? null })));
  } catch {
    return [];
  }
}

export async function getVisibleVehicles() {
  try {
    const [rows, { byVehicle }] = await Promise.all([
      prisma.vehicle.findMany({ where: { available: true, published: true, ...VISIBLE }, orderBy: [{ featured: 'desc' }, { basePrice: 'asc' }] }),
      getPromoMaps(),
    ]);
    return plain(rows.map((v) => ({ ...v, promo: byVehicle[v.id] ?? null })));
  } catch {
    return [];
  }
}

/** Véhicules (neufs + occasions) auxquels au moins une pièce visible est rattachée. */
export async function getCompatibilityTargets(parts: { compatibleVehicleIds?: string[]; compatibleUsedVehicleIds?: string[] }[]) {
  const vIds = new Set(parts.flatMap((p) => p.compatibleVehicleIds ?? []));
  const uIds = new Set(parts.flatMap((p) => p.compatibleUsedVehicleIds ?? []));
  if (!vIds.size && !uIds.size) return [];
  try {
    const [v, u] = await Promise.all([
      prisma.vehicle.findMany({ where: { id: { in: [...vIds] } }, select: { id: true, name: true } }),
      prisma.usedVehicle.findMany({ where: { id: { in: [...uIds] } }, select: { id: true, name: true } }),
    ]);
    return [...v.map((x) => ({ id: x.id, name: x.name, kind: 'neuf' as const })), ...u.map((x) => ({ id: x.id, name: x.name, kind: 'occasion' as const }))];
  } catch {
    return [];
  }
}
