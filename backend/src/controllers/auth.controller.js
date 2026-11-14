import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// field ที่ยอมให้ส่งกลับไปหา client (ไม่มี password)
const publicUserFields = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
};

// POST /api/v1/auth/register
export async function register(req, res) {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: { message: 'email, password and name are required' } });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: { message: 'password must be at least 8 characters' } });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return res
      .status(409)
      .json({ error: { message: 'Email already registered' } });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // ไม่รับ role จาก body เด็ดขาด: คนสมัครเองต้องเป็น CUSTOMER เสมอ
  const user = await prisma.user.create({
    data: { email: normalizedEmail, password: hashedPassword, name },
    select: publicUserFields,
  });

  res.status(201).json({ data: user });
}

// POST /api/v1/auth/login
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: { message: 'email and password are required' } });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // อีเมลไม่มีในระบบ กับ รหัสผิด ตอบข้อความเดียวกัน
  const isValid = user && (await bcrypt.compare(password, user.password));
  if (!isValid) {
    return res
      .status(401)
      .json({ error: { message: 'Invalid email or password' } });
  }

  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  res.status(200).json({
    data: {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
}

// GET /api/v1/auth/me  (ต้องล็อกอิน)
export async function getMe(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: publicUserFields,
  });
  if (!user) {
    return res.status(404).json({ error: { message: 'User not found' } });
  }
  res.status(200).json({ data: user });
}