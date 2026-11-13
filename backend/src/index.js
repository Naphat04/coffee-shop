import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json()); // ให้อ่าน body ที่เป็น JSON ได้

// endpoint ไว้เช็กว่า server ยังทำงานอยู่
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// path ที่ไม่มีอยู่จริง → 404
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});