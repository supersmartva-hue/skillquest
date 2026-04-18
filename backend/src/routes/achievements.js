const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [all, earned] = await Promise.all([
      prisma.achievement.findMany({ orderBy: [{ rarity: 'asc' }, { name: 'asc' }] }),
      prisma.userAchievement.findMany({ where: { userId: req.user.id }, select: { achievementId: true, unlockedAt: true } }),
    ]);

    const earnedMap = Object.fromEntries(earned.map((e) => [e.achievementId, e.unlockedAt]));

    const achievements = all.map((a) => ({
      ...a,
      // Parse condition JSON string back to object for frontend
      condition:   JSON.parse(a.condition || '{}'),
      earned:      !!earnedMap[a.id],
      unlockedAt:  earnedMap[a.id] ?? null,
    }));

    res.json({ achievements });
  } catch (err) { next(err); }
});

module.exports = router;
