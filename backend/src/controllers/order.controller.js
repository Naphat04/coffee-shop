import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { HttpError } from '../utils/http-error.js';

const SINGLE_CHOICE_GROUPS = ['SIZE', 'SWEETNESS']; // กลุ่มที่เลือกได้แค่ 1 ตัวต่อแก้ว
const MAX_QUANTITY = 20;

// เช็กว่า body ที่ส่งมามีหน้าตาถูกต้องไหม (ยังไม่แตะ database)
function parseItems(body) {
  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'items must be a non-empty array');
  }

  return items.map((item, index) => {
    const productId = Number(item?.productId);
    const quantity = Number(item?.quantity);
    const optionIds = item?.optionIds ?? [];

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new HttpError(400, `items[${index}].productId is invalid`);
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new HttpError(400, `items[${index}].quantity must be 1-${MAX_QUANTITY}`);
    }
    if (!Array.isArray(optionIds) || !optionIds.every((id) => Number.isInteger(id) && id > 0)) {
      throw new HttpError(400, `items[${index}].optionIds must be an array of ids`);
    }

    return { productId, quantity, optionIds: [...new Set(optionIds)] };
  });
}

// POST /api/v1/orders
export async function createOrder(req, res) {
  const items = parseItems(req.body);
  const note = typeof req.body.note === 'string' ? req.body.note.trim() || null : null;

  const order = await prisma.$transaction(async (tx) => {
    // 1) ดึงสินค้าและตัวเลือกทั้งหมดที่ใช้ในออเดอร์นี้ ในครั้งเดียว
    const productIds = [...new Set(items.map((i) => i.productId))];
    const optionIds = [...new Set(items.flatMap((i) => i.optionIds))];

    const products = await tx.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    });
    const options = await tx.option.findMany({
      where: { id: { in: optionIds }, isAvailable: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const optionMap = new Map(options.map((o) => [o.id, o]));

    // 2) คำนวณราคาทีละรายการ ด้วยราคาจาก database เท่านั้น
    let totalPrice = new Prisma.Decimal(0);

    const itemsData = items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new HttpError(400, `Product ${item.productId} is not available`);
      }

      const chosen = item.optionIds.map((id) => {
        const option = optionMap.get(id);
        if (!option) throw new HttpError(400, `Option ${id} is not available`);
        return option;
      });

      for (const group of SINGLE_CHOICE_GROUPS) {
        if (chosen.filter((o) => o.group === group).length > 1) {
          throw new HttpError(400, `Only one ${group} option allowed per item`);
        }
      }

      const unitPrice = chosen.reduce((sum, o) => sum.plus(o.extraPrice), product.price);
      const subtotal = unitPrice.times(item.quantity);
      totalPrice = totalPrice.plus(subtotal);

      return {
        productId: product.id,
        productName: product.name, // snapshot
        unitPrice,                 // snapshot
        quantity: item.quantity,
        subtotal,
        options: {
          create: chosen.map((o) => ({
            optionName: o.name,
            group: o.group,
            extraPrice: o.extraPrice,
          })),
        },
      };
    });

    // 3) บันทึกออเดอร์ + รายการ + ตัวเลือก
    return tx.order.create({
      data: {
        userId: req.user.id,
        note,
        totalPrice,
        items: { create: itemsData },
      },
      include: { items: { include: { options: true } } },
    });
  });

  res.status(201).json({ data: order });
}

// GET /api/v1/orders/:id
export async function getOrderById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, 'Invalid order id');
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { options: true } } },
  });

  const isOwner = order?.userId === req.user.id;
  const isAdmin = req.user.role === 'ADMIN';

  // ออเดอร์ของคนอื่น ตอบ 404 เหมือนไม่มีอยู่จริง
  if (!order || (!isOwner && !isAdmin)) {
    throw new HttpError(404, 'Order not found');
  }

  res.status(200).json({ data: order });
}