const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'donate-ease-secret-key-change-in-production-2026';
const JWT_EXPIRES_IN = '7d';

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Try cookie
    const cookie = request.headers.get('cookie') || '';
    const match = cookie.match(/token=([^;]+)/);
    if (!match) return null;
    return verifyToken(match[1]);
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

function requireAuth(request, allowedRoles = []) {
  const user = getUserFromRequest(request);
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user };
}

function generateDonationId() {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `DON-${year}-${random}`;
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  getUserFromRequest,
  requireAuth,
  generateDonationId
};
