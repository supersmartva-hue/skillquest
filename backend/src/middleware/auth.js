/**
 * JWT Authentication Middleware
 */
const jwt    = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided. Please log in.' });
    }

    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where:  { id: decoded.userId },
      select: { id: true, email: true, username: true, displayName: true, level: true, xp: true, xpToNextLevel: true, isPremium: true },
    });

    if (!user) return res.status(401).json({ error: 'User no longer exists.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Token expired. Please log in again.' });
    if (err.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token.' });
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  return authenticate(req, res, next);
};

const requirePremium = (req, res, next) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({ error: 'This feature requires a premium subscription.', upgradeUrl: '/pricing' });
  }
  next();
};

module.exports = { authenticate, optionalAuth, requirePremium };
