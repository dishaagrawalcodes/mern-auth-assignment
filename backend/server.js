require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const verifyAccessToken = require('./middleware/verifyAccessToken');

const app = express();

// ---------- Middleware ----------
app.use(express.json());
app.use(cookieParser());

// CORS: allow the frontend origin, and allow cookies to be sent cross-site

app.use(cors({
   origin: [
    "http://localhost:5173",
    "https://mern-auth-assignment-ju6mtvl2p-dishaagrawalcodes-projects.vercel.app/"
],
    credentials: true
}));

// ---------- Routes ----------
app.use('/api/auth', authRoutes);

// Dummy protected dashboard route -> only reachable with a valid access token
app.get('/api/dashboard', verifyAccessToken, (req, res) => {
  res.json({
    message: 'Welcome to your dashboard!',
    userId: req.userId,
  });
});

// Basic health check
app.get('/', (req, res) => {
  res.send('API is running');
});

// ---------- DB + Server start ----------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });