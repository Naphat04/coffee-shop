import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const options = [
  { name: 'Medium', group: 'SIZE', extraPrice: 0 },
  { name: 'Large', group: 'SIZE', extraPrice: 10 },
  { name: 'Sweet 0%', group: 'SWEETNESS', extraPrice: 0 },
  { name: 'Sweet 50%', group: 'SWEETNESS', extraPrice: 0 },
  { name: 'Sweet 100%', group: 'SWEETNESS', extraPrice: 0 },
  { name: 'Pearl', group: 'TOPPING', extraPrice: 10 },
  { name: 'Extra shot', group: 'TOPPING', extraPrice: 15 },
  { name: 'Whipped cream', group: 'TOPPING', extraPrice: 10 },
];

async function main() {
  const count = await prisma.option.count();
  if (count > 0) {
    console.log('Options already seeded, skip');
    return;
  }
  await prisma.option.createMany({ data: options });
  console.log(`Seeded ${options.length} options`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}