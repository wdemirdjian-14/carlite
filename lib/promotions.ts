import { prisma } from '@/lib/prisma';

export function isPromoLive(p: any): boolean {
  if (!p?.active) return false;
  const now = Date.now();
  if (p?.startDate && new Date(p.startDate).getTime() > now) return false;
  if (p?.endDate && new Date(p.endDate).getTime() < now) return false;
  return true;
}

type PromoMaps = {
  byVehicle: Record<string, any>;
  byAccessory: Record<string, any>;
  byUsed: Record<string, any>;
};

export async function getPromoMaps(): Promise<PromoMaps> {
  const maps: PromoMaps = { byVehicle: {}, byAccessory: {}, byUsed: {} };
  try {
    const promos = await prisma.promotion.findMany({ where: { active: true } });
    promos.filter(isPromoLive).forEach((p: any) => {
      if (p.targetType === 'vehicle' && p.vehicleId) maps.byVehicle[p.vehicleId] = p;
      else if (p.targetType === 'accessory' && p.accessoryId) maps.byAccessory[p.accessoryId] = p;
      else if (p.targetType === 'used' && p.usedVehicleId) maps.byUsed[p.usedVehicleId] = p;
    });
  } catch {}
  return maps;
}

// Fetch featured live promotions with their resolved product, for the homepage.
export async function getFeaturedPromotions(): Promise<any[]> {
  try {
    const promos = await prisma.promotion.findMany({ where: { active: true, featured: true }, orderBy: { createdAt: 'desc' } });
    const live = promos.filter(isPromoLive);
    const result: any[] = [];
    for (const p of live) {
      let product: any = null;
      let href = '#';
      let originalPrice: number | null = null;
      if (p.targetType === 'vehicle' && p.vehicleId) {
        product = await prisma.vehicle.findUnique({ where: { id: p.vehicleId } });
        if (product) { href = `/vehicules/${product.slug}`; originalPrice = product.basePrice; }
      } else if (p.targetType === 'used' && p.usedVehicleId) {
        product = await prisma.usedVehicle.findUnique({ where: { id: p.usedVehicleId } });
        if (product) { href = `/occasion/${product.slug}`; originalPrice = product.price; }
      } else if (p.targetType === 'accessory' && p.accessoryId) {
        product = await prisma.accessory.findUnique({ where: { id: p.accessoryId } });
        if (product) { href = `/accessoires`; originalPrice = product.price; }
      }
      if (product) {
        result.push({
          id: p.id,
          title: p.title,
          badge: p.badge,
          description: p.description,
          discountedPrice: p.discountedPrice,
          originalPrice,
          productName: product.name,
          imageUrl: product.imageUrl,
          href,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}
