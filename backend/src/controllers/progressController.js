/**
 * Progress Controller — Lesson completion, XP awards, skill tracking
 */

const prisma  = require('../lib/prisma');
const { awardXP } = require('../services/xpService');

// ── POST /api/progress/complete-lesson ──────────────────────────────────────
const completeLesson = async (req, res, next) => {
  try {
    const { lessonId, score: rawScore } = req.body;
    const userId = req.user.id;

    // Clamp score to 0-100
    const score = rawScore !== undefined ? Math.max(0, Math.min(100, Number(rawScore))) : undefined;

    const lesson = await prisma.lesson.findUnique({
      where:   { id: lessonId },
      include: { skill: true },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    const existing = await prisma.progress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    const isFirst = !existing || existing.status !== 'completed';
    const scoreMultiplier = score !== undefined ? Math.max(0.5, score / 100) : 1;
    const xpEarned = Math.floor(lesson.xpReward * scoreMultiplier * (isFirst ? 1 : 0.25));

    await prisma.progress.upsert({
      where:  { userId_lessonId: { userId, lessonId } },
      create: { userId, skillId: lesson.skillId, lessonId, status: 'completed', score, attempts: 1, completedAt: new Date() },
      update: {
        status:      'completed',
        score:       existing?.score != null ? Math.max(existing.score, score ?? 0) : score,
        attempts:    { increment: 1 },
        completedAt: existing?.status !== 'completed' ? new Date() : existing.completedAt,
      },
    });

    const xpResult = await awardXP(userId, xpEarned, 'lesson_complete', {
      lessonId,
      lessonTitle: lesson.title,
      skillId:     lesson.skillId,
      score,
    });

    // Check if skill is now fully mastered
    const skillLessons    = await prisma.lesson.findMany({ where: { skillId: lesson.skillId, isActive: true }, select: { id: true } });
    const completedCount  = await prisma.progress.count({ where: { userId, lessonId: { in: skillLessons.map((l) => l.id) }, status: 'completed' } });
    const skillMastered   = completedCount === skillLessons.length;

    res.json({
      message: isFirst ? 'Lesson completed!' : 'Lesson replayed!',
      xpEarned,
      score,
      skillMastered,
      skill:  skillMastered ? lesson.skill : null,
      ...xpResult,
    });
  } catch (err) { next(err); }
};

// ── GET /api/progress/user ───────────────────────────────────────────────────
const getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [skills, recentActivity, stats] = await Promise.all([
      prisma.skill.findMany({
        where:   { isActive: true },
        include: {
          lessons:  { where: { isActive: true }, select: { id: true } },
          progress: { where: { userId }, select: { lessonId: true, status: true, score: true } },
        },
      }),
      prisma.progress.findMany({
        where:   { userId, status: 'completed' },
        orderBy: { completedAt: 'desc' },
        take:    10,
        include: {
          lesson: { select: { title: true, xpReward: true } },
          skill:  { select: { name: true, icon: true, color: true } },
        },
      }),
      prisma.progress.aggregate({ where: { userId, status: 'completed' }, _count: { id: true } }),
    ]);

    const skillsWithProgress = skills.map((skill) => {
      const total     = skill.lessons.length;
      const completed = skill.progress.filter((p) => p.status === 'completed' && p.lessonId).length;
      const scores    = skill.progress.map((p) => p.score).filter((s) => s != null);

      return {
        id: skill.id, name: skill.name, icon: skill.icon, color: skill.color, category: skill.category,
        totalLessons:       total,
        completedLessons:   completed,
        completionPercent:  total > 0 ? Math.round((completed / total) * 100) : 0,
        mastered:           total > 0 && completed === total,
        averageScore:       scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      };
    });

    res.json({ skills: skillsWithProgress, recentActivity, totalCompleted: stats._count.id });
  } catch (err) { next(err); }
};

// ── GET /api/progress/xp-history ────────────────────────────────────────────
const getXPHistory = async (req, res, next) => {
  try {
    const days  = Math.max(1, Math.min(365, parseInt(req.query.days) || 30));
    const since = new Date(Date.now() - days * 86400000);

    const logs = await prisma.xPLog.findMany({
      where:   { userId: req.user.id, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });

    const dailyXP = logs.reduce((acc, log) => {
      const day  = log.createdAt.toISOString().split('T')[0];
      acc[day]   = (acc[day] || 0) + log.amount;
      return acc;
    }, {});

    res.json({ logs, dailyXP });
  } catch (err) { next(err); }
};

module.exports = { completeLesson, getUserProgress, getXPHistory };
