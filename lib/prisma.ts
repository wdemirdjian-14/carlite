import { PrismaClient } from '@prisma/client';

// Le prix d'achat des pièces est confidentiel : il est exclu de TOUTES les requêtes par défaut
// (pages publiques, API, flux Google…). Seules les requêtes de l'admin le demandent explicitement
// avec `omit: { purchasePrice: false }`.
function createClient() {
  return new PrismaClient({ omit: { accessory: { purchasePrice: true } } });
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
