/**
 * Auth Controller — Signup, Login, Token refresh, Get current user
 */

const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const prisma     = require('../lib/prisma');
const { validationResult } = require('express-validator');
const { updateStreak } = require('../services/xpService');

// ── Token helpers ────────────────────────────────────────────────────────────
const generateTokens = (userId) => ({
  accessToken:  jwt.sign({ userId }, process.env.JWT_SECRET,         { expiresIn: '1h' }),
  refreshToken: jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
});

// Fields returned on every auth response — keeps responses consistent
const USER_SELECT = {
  id: true, email: true, username: true, displayName: true,
  avatar: true, bio: true, level: true, xp: true,
  xpToNextLevel: true, streak: true, longestStreak: true,
  isPremium: true, createdAt: true,
};

// ── SIGNUP ───────────────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, displayName, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email:       email.toLowerCase().trim(),
        username:    username.toLowerCase().trim(),
        displayName: displayName.trim(),
        passwordHash,
      },
      select: USER_SELECT,
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    res.status(201).json({ message: 'Account created successfully!', user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
};

// ── LOGIN ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    // Generic message prevents user enumeration
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const streakData = await updateStreak(user.id);
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Re-fetch with full USER_SELECT (passwordHash excluded)
    const safeUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: USER_SELECT,
    });

    res.json({
      message: 'Welcome back!',
      user: { ...safeUser, ...streakData },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── REFRESH TOKEN ────────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ error: 'Refresh token required.' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRefresh } = generateTokens(decoded.userId);
    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }
    next(err);
  }
};

// ── GET CURRENT USER ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        ...USER_SELECT,
        _count: {
          select: {
            progress:        { where: { status: 'completed' } },
            userAchievements: true,
          },
        },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, refreshToken, getMe };
