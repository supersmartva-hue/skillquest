const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { awardXP } = require('../services/xpService');

const CHALLENGE_POOL = [
  { task: 'Complete 3 lessons today',           xpReward: 50 },
  { task: 'Score 100% on any quiz',             xpReward: 75 },
  { task: 'Start learning a new skill',         xpReward: 60 },
  { task: 'Log in and maintain your streak',    xpReward: 30 },
  { task: 'Complete a coding lesson',           xpReward: 80 },
  { task: 'Finish all lessons in one skill',    xpReward: 100 },
];

router.get('/today', authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let challenge = await prisma.dailyChallenge.findUnique({
      where: { userId_date: { userId: req.user.id, date: today } },
    });

    if (!challenge) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const template  = CHALLENGE_POOL[dayOfYear % CHALLENGE_POOL.length];
      challenge = await prisma.dailyChallenge.create({
        data: { userId: req.user.id, date: today, task: template.task, xpReward: template.xpReward },
      });
    }

    const now = new Date();
    const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const secondsRemaining = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000));

    res.json({ challenge, secondsRemaining });
  } catch (err) { next(err); }
});

router.post('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const challenge = await prisma.dailyChallenge.findUnique({ where: { id: req.params.id } });
    if (!challenge)                   return res.status(404).json({ error: 'Challenge not found.' });
    if (challenge.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden.' });
    if (challenge.completed)          return res.status(400).json({ error: 'Already completed.' });

    await prisma.dailyChallenge.update({ where: { id: challenge.id }, data: { completed: true, completedAt: new Date() } });

    const xpResult = await awardXP(req.user.id, challenge.xpReward, 'daily_challenge', { challengeId: challenge.id });
    res.json({ message: 'Daily challenge complete!', xpEarned: challenge.xpReward, ...xpResult });
  } catch (err) { next(err); }
});

module.exports = router;
