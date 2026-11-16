import prisma from '../lib/prisma.js';

// GET /api/v1/options
export async function getOptions(req, res) {
  const options = await prisma.option.findMany({
    where: { isAvailable: true },
    orderBy: [{ group: 'asc' }, { id: 'asc' }],
  });
  res.status(200).json({ data: options });
}