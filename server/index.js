require('dotenv').config();
const express = require('express');
const cors = require('cors');
const portfolioRouter = require('./routes/portfolio');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.CLIENT_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) return cb(null, true);
    cb(new Error('CORS: ' + origin + ' not allowed'));
  },
  credentials: true
}));

app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));
app.use('/api/portfolio', portfolioRouter);

app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log('PalmTek API server running on port ' + PORT);
  if (!process.env.ADO_PAT) {
    console.warn('WARNING: ADO_PAT not set — requests will fail');
  }
});
