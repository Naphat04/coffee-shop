import jwt from 'jsonwebtoken';

// ต้องล็อกอินก่อน
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

// ต้องมี role ตามที่กำหนด (ใช้ต่อจาก requireAuth)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: { message: 'Forbidden' } });
    }
    next();
  };
}