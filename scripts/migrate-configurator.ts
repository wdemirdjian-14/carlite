import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// One-time migration: convert legacy VehicleColor + VehicleOption data into the
// new dynamic ConfigCategory / ConfigOption system. Idempotent: skips any
// vehicle that already has at least one ConfigCategory.
async function main() {
  const vehicles = await prisma.vehicle.findMany({
    include: { colors: true, options: true, configCategories: true },
  });

  for (const v of vehicles) {
    if ((v.configCategories?.length ?? 0) > 0) {
      console.log(`Skip ${v.name} (already migrated)`);
      continue;
    }

    let order = 0;

    // 1) Colors -> a single "Couleur" category (radio) with colored options
    if ((v.colors?.length ?? 0) > 0) {
      const cat = await prisma.configCategory.create({
        data: {
          vehicleId: v.id,
          name: 'Couleur carrosserie',
          icon: 'Palette',
          description: '',
          selectionType: 'radio',
          required: true,
          order: order++,
        },
      });
      let oOrder = 0;
      for (const c of v.colors) {
        await prisma.configOption.create({
          data: {
            categoryId: cat.id,
            name: c.name,
            priceModifier: c.price ?? 0,
            colorHex: c.hex ?? '',
            active: true,
            order: oOrder++,
          },
        });
      }
    }

    // 2) Options grouped by their free-text `category` -> one checkbox category each
    const groups = new Map<string, typeof v.options>();
    for (const o of v.options ?? []) {
      const key = (o.category ?? 'Options').trim() || 'Options';
      if (!groups.has(key)) groups.set(key, [] as any);
      groups.get(key)!.push(o);
    }
    for (const [groupName, opts] of Array.from(groups.entries())) {
      const cat = await prisma.configCategory.create({
        data: {
          vehicleId: v.id,
          name: groupName,
          icon: 'Package',
          description: '',
          selectionType: 'checkbox',
          required: false,
          order: order++,
        },
      });
      let oOrder = 0;
      for (const o of opts) {
        await prisma.configOption.create({
          data: {
            categoryId: cat.id,
            name: o.name,
            priceModifier: o.price ?? 0,
            description: o.description ?? '',
            imageUrl: o.imageUrl ?? '',
            active: true,
            order: oOrder++,
          },
        });
      }
    }

    console.log(`Migrated ${v.name}: ${order} categories`);
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
