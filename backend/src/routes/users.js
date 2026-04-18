const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, email: true, username: true, displayName: true, avatar: true, bio: true, level: true, xp: true, xpToNextLevel: true, streak: true, longestStreak: true, isPremium: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const { displayName, bio, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: { id: true, displayName: true, bio: true, avatar: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
});

module.exports = router;
