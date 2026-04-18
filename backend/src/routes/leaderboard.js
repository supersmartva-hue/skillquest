const router = require('express').Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

// GET /api/leaderboard/global
router.get('/global', optionalAuth, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { xp: 'desc' },
        skip, take: limit,
        select: { id: true, username: true, displayName: true, avatar: true, level: true, xp: true, streak: true, _count: { select: { userAchievements: true } } },
      }),
      prisma.user.count(),
    ]);

    const ranked = users.map((u, i) => ({
      ...u, rank: skip + i + 1,
      achievementCount: u._count.userAchievements,
      isCurrentUser: req.user?.id === u.id,
    }));

    let currentUserRank = null;
    if (req.user) {
      const above = await prisma.user.count({ where: { xp: { gt: req.user.xp } } });
      currentUserRank = above + 1;
    }

    res.json({ users: ranked, total, page, totalPages: Math.ceil(total / limit), currentUserRank });
  } catch (err) { next(err); }
});

// GET /api/leaderboard/weekly
router.get('/weekly', optionalAuth, async (req, res, next) => {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyXP = await prisma.xPLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekStart } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 50,
    });

    const userIds = weeklyXP.map((w) => w.userId);
    const users   = await prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, username: true, displayName: true, avatar: true, level: true, streak: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const ranked = weeklyXP.map((entry, i) => ({
      rank: i + 1, weeklyXP: entry._sum.amount ?? 0,
      isCurrentUser: req.user?.id === entry.userId,
      ...userMap[entry.userId],
    }));

    res.json({ users: ranked, weekStart });
  } catch (err) { next(err); }
});

module.exports = router;
