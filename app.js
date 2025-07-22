const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { syncDB } = require('./models');
// ✅ Connect to MongoDB (Mongo Comments Only)

// RAW BODY ONLY FOR WEBHOOK
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();

// 1️⃣ Webhook raw body parser
app.use('/webhook', bodyParser.raw({ type: 'application/json' }));

// 2️⃣ Enable CORS and JSON parsing for API routes
app.use(cors());
app.options('*', cors());
app.use(express.json());

// 3️⃣ API Routes (register before serving frontend)
app.use('/webhook', require('./routes/webhook'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use('/api/mongo', require('./routes/mongoCommentRoutes'));

// Image proxy endpoint to bypass ngrok browser warning for images
app.get('/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).send('Missing url parameter');
  }
  try {
    const response = await fetch(imageUrl, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!response.ok) {
      return res.status(response.status).send('Image not found');
    }
    res.set('Content-Type', response.headers.get('content-type'));
    response.body.pipe(res);
  } catch (err) {
    res.status(500).send('Proxy error');
  }
});

// 4️⃣ Sync PostgreSQL database
syncDB();

// 5️⃣ Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// 6️⃣ SPA catch-all - serve products.html for any unmatched non-API route
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

module.exports = app;
