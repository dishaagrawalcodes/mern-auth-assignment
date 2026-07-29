const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Helper: create a short-lived access token
function generateAccessToken(user) {
  return jwt.sign({ userId: user._id }, ACCESS_SECRET, { expiresIn: '15m' });
}

// Helper: create a long-lived refresh token, tied to the user's current token version
function generateRefreshToken(user) {
  return jwt.sign(
    { userId: user._id, version: user.refreshTokenVersion },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Helper: set the refresh token as an httpOnly cookie
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true, // JS on the frontend can NEVER read this cookie -> mitigates XSS token theft
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches token expiry
    path: '/api/auth', // only sent to auth endpoints, not every request
  });
}

// ---------- SIGNUP ----------
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ---------- REFRESH ----------
// Frontend calls this when the access token expires (gets a 401).
// Reads the refresh token from the httpOnly cookie, verifies it,
// and issues a brand new access token (and rotates the refresh token).
router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Invalid' });
    }

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch (err) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // If the version in the token doesn't match the DB, it means the user
    // logged out (or changed password) since this token was issued -> reject it
    if (payload.version !== user.refreshTokenVersion) {
      return res.status(403).json({ message: 'Refresh token has been revoked' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user); // rotation: issue a new one each time
    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ message: 'Server error during refresh' });
  }
});

// ---------- LOGOUT ----------
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      try {
        const payload = jwt.verify(token, REFRESH_SECRET);
        // Bump the version so this (and any other outstanding) refresh token is invalidated
        await User.findByIdAndUpdate(payload.userId, {
          $inc: { refreshTokenVersion: 1 },
        });
      } catch (err) {
        // Token was already invalid/expired - nothing to revoke, just clear the cookie
      }
    }

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;