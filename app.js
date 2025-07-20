const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
require('dotenv').config();
const { syncDB } = require('./models');
/*const compression = require('compression');
app.use(compression());*/

// ✅ Connect to MongoDB (Mongo Comments Only)
const connectMongo = require("./mongo/connection");connectMongo(); // MongoDB connected

// RAW BODY ONLY FOR WEBHOOK
const bodyParser = require('body-parser');
app.use('/webhook', bodyParser.raw({ type: 'application/json' })); // ONLY RAW HERE

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// JSON Body for everything else (MUST COME AFTER /webhook)
app.use(cors());
app.use(express.json());

// 🔁 Routes
app.use('/webhook', require('./routes/webhook'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/uploads', express.static('uploads'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));

// ✅ New Mongo Comments Route
app.use('/api/mongo', require('./routes/mongoCommentRoutes'));
// Sync PostgreSQL DB
syncDB();

module.exports = app;
