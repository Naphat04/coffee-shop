import prisma from '../lib/prisma.js';

// แปลง :id จาก URL เป็นตัวเลข ถ้าไม่ใช่ตัวเลขคืนค่า null
function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// GET /api/v1/products
export async function getProducts(req, res) {
  const products = await prisma.product.findMany({
    orderBy: { id: 'asc' },
  });
  res.status(200).json({ data: products });
}

// GET /api/v1/products/:id
export async function getProductById(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: { message: 'Invalid product id' } });
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ error: { message: 'Product not found' } });
  }

  res.status(200).json({ data: product });
}

// POST /api/v1/products
export async function createProduct(req, res) {
  const { name, description, price, category, isAvailable } = req.body;

  if (!name || price === undefined || !category) {
    return res
      .status(400)
      .json({ error: { message: 'name, price and category are required' } });
  }
  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    return res
      .status(400)
      .json({ error: { message: 'price must be a positive number' } });
  }

  const product = await prisma.product.create({
    data: { name, description, price, category, isAvailable },
  });

  res.status(201).json({ data: product });
}

// PATCH /api/v1/products/:id
export async function updateProduct(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: { message: 'Invalid product id' } });
  }

  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) {
    return res.status(404).json({ error: { message: 'Product not found' } });
  }

  const { name, description, price, category, isAvailable } = req.body;
  const product = await prisma.product.update({
    where: { id },
    data: { name, description, price, category, isAvailable },
  });

  res.status(200).json({ data: product });
}

// DELETE /api/v1/products/:id
export async function deleteProduct(req, res) {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: { message: 'Invalid product id' } });
  }

  const exists = await prisma.product.findUnique({ where: { id } });
  if (!exists) {
    return res.status(404).json({ error: { message: 'Product not found' } });
  }

  await prisma.product.delete({ where: { id } });
  res.status(204).send();
}