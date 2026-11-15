import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';   // ← ไว้ข้างบนกับ import อื่น
import { HttpError } from './utils/http-error.js';


const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auth', authRoutes);


// 404 สำหรับ path ที่ไม่มี
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

// error ที่ไม่ได้คาดไว้ทั้งหมดจะมาจบที่นี่ (ต้องมี 4 parameter)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message } });
  }
  console.error(err);
  res.status(500).json({ error: { message: 'Internal server error' } });
});