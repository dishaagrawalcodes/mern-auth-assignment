const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;

// Expects: Authorization: Bearer <accessToken>
function verifyAccessToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No access token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.userId = payload.userId; // attach to request for downstream routes
    next();
  } catch (err) {
    // Expired or invalid -> frontend should call /api/auth/refresh and retry
    return res.status(401).json({ message: 'Access token expired or invalid' });
  }
}

module.exports = verifyAccessToken;