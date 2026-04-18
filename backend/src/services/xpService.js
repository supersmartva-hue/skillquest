/**
 * XP Service — Core gamification engine
 */
const prisma = require('../lib/prisma');

const XP_BASE     = 100;
const XP_EXPONENT = 1.5;
const xpForLevel  = (level) => Math.floor(XP_BASE * Math.pow(level, XP_EXPONENT));

// Total XP required to reach a given level from zero
const xpToReachLevel = (targetLevel) => {
  let total = 0;
  for (let l = 1; l < targetLevel; l++) total += xpForLevel(l);
  return total;
};

const awardXP = async (userId, amount, reason, meta = {}) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, xp: true, level: true, xpToNextLevel: true },
  });
  if (!user) throw new Error('User not found');

  const newXP    = user.xp + amount;
  let newLevel   = user.level;
  let didLevelUp = false;
  const levelUps = [];

  // XP within the current level before this award, plus the new amount
  const xpInCurrentLevel = user.xp - xpToReachLevel(user.level);
  let remaining = xpInCurrentLevel + amount;

  while (remaining >= xpForLevel(newLevel)) {
    remaining -= xpForLevel(newLevel);
    newLevel++;
    didLevelUp = true;
    levelUps.push(newLevel);
  }
  const newXpToNextLevel = xpForLevel(newLevel);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where:  { id: userId },
      data:   { xp: newXP, level: newLevel, xpToNextLevel: newXpToNextLevel },
      select: { id: true, xp: true, level: true, xpToNextLevel: true, username: true, displayName: true },
    }),
    prisma.xPLog.create({
      data: { userId, amount, reason, meta: JSON.stringify(meta) },
    }),
  ]);

  const newAchievements = await checkAchievements(userId, updatedUser);

  return {
    user:            updatedUser,
    xpAwarded:       amount,
    didLevelUp,
    newLevel:        didLevelUp ? newLevel : undefined,
    levelUps,
    newAchievements,
  };
};

const checkAchievements = async (userId, user) => {
  const earnedIds = (
    await prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } })
  ).map((ua) => ua.achievementId);

  const unearned = await prisma.achievement.findMany({ where: { id: { notIn: earnedIds } } });
  const toUnlock = [];

  for (const achievement of unearned) {
    let condition;
    try { condition = JSON.parse(achievement.condition || '{}'); } catch { continue; }

    let qualifies = false;
    switch (condition.type) {
      case 'level_reached':      qualifies = user.level >= condition.threshold; break;
      case 'total_xp':           qualifies = user.xp >= condition.threshold; break;
      case 'lessons_completed': {
        const n = await prisma.progress.count({ where: { userId, status: 'completed', lessonId: { not: null } } });
        qualifies = n >= condition.threshold;
        break;
      }
      case 'streak': {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { streak: true } });
        qualifies = (u?.streak ?? 0) >= condition.threshold;
        break;
      }
      default: break;
    }
    if (qualifies) toUnlock.push(achievement);
  }

  if (toUnlock.length > 0) {
    // SQLite does not support createMany skipDuplicates — insert one-by-one and ignore conflicts
    for (const a of toUnlock) {
      await prisma.userAchievement.upsert({
        where:  { userId_achievementId: { userId, achievementId: a.id } },
        create: { userId, achievementId: a.id },
        update: {},
      });
    }
    const bonus = toUnlock.reduce((s, a) => s + (a.xpReward ?? 0), 0);
    if (bonus > 0) await prisma.user.update({ where: { id: userId }, data: { xp: { increment: bonus } } });
  }

  return toUnlock;
};

const updateStreak = async (userId) => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { streak: true, longestStreak: true, lastActiveAt: true },
  });

  const now = new Date();
  let newStreak = user.streak;

  if (user.lastActiveAt) {
    // Pure UTC midnight timestamps — immune to server timezone offsets
    const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const lastMs  = Date.UTC(
      new Date(user.lastActiveAt).getUTCFullYear(),
      new Date(user.lastActiveAt).getUTCMonth(),
      new Date(user.lastActiveAt).getUTCDate()
    );
    const daysDiff = Math.floor((todayMs - lastMs) / 86_400_000);

    if (daysDiff === 0) { /* same day — no change */ }
    else if (daysDiff === 1) newStreak += 1;
    else newStreak = 1; // streak broken
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, user.longestStreak);
  await prisma.user.update({
    where: { id: userId },
    data:  { streak: newStreak, longestStreak: newLongest, lastActiveAt: new Date() },
  });

  return { streak: newStreak, longestStreak: newLongest };
};

module.exports = { awardXP, checkAchievements, updateStreak, xpForLevel, xpToReachLevel };
