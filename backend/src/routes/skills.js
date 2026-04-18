/**
 * Skills Routes — /api/skills/*
 * NOTE: specific routes (meta/categories) must be BEFORE parameterised /:id
 */

const router  = require('express').Router();
const prisma  = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

// ── GET /api/skills/meta/categories ─────────────────────────────────────────
// Must be BEFORE /:id to avoid Express matching "meta" as an id param
router.get('/meta/categories', async (req, res, next) => {
  try {
    const rows = await prisma.skill.findMany({
      where:    { isActive: true },
      select:   { category: true },
      distinct: ['category'],
    });
    res.json({ categories: rows.map((r) => r.category) });
  } catch (err) { next(err); }
});

// ── GET /api/skills ──────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category } = req.query;

    const skills = await prisma.skill.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      include: {
        lessons: {
          where:   { isActive: true },
          select:  { id: true, title: true, order: true, type: true, xpReward: true, duration: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { lessons: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });

    if (req.user) {
      const progress = await prisma.progress.findMany({
        where:  { userId: req.user.id },
        select: { skillId: true, lessonId: true, status: true, score: true },
      });

      const progressByLesson = Object.fromEntries(
        progress.filter((p) => p.lessonId).map((p) => [p.lessonId, p])
      );
      const completedSkillIds = new Set(
        progress.filter((p) => p.status === 'completed' && p.skillId).map((p) => p.skillId)
      );

      const skillsWithProgress = skills.map((skill) => {
        const completed = skill.lessons.filter((l) => progressByLesson[l.id]?.status === 'completed').length;
        // prerequisites stored as JSON string in SQLite
        let prereqs = [];
        try { prereqs = JSON.parse(skill.prerequisites || '[]'); } catch {}

        return {
          ...skill,
          prerequisites: prereqs,
          lessons: skill.lessons.map((l) => ({ ...l, progress: progressByLesson[l.id] ?? null })),
          completedLessons:   completed,
          completionPercent:  skill.lessons.length > 0 ? Math.round((completed / skill.lessons.length) * 100) : 0,
          unlocked: prereqs.length === 0 || prereqs.every((id) => completedSkillIds.has(id)),
          mastered: skill.lessons.length > 0 && completed === skill.lessons.length,
        };
      });

      return res.json({ skills: skillsWithProgress });
    }

    // Unauthenticated — all skills without user progress
    const publicSkills = skills.map((skill) => {
      let prereqs = [];
      try { prereqs = JSON.parse(skill.prerequisites || '[]'); } catch {}
      return { ...skill, prerequisites: prereqs, unlocked: prereqs.length === 0 };
    });

    res.json({ skills: publicSkills });
  } catch (err) { next(err); }
});

// ── GET /api/skills/:id ──────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const skill = await prisma.skill.findUnique({
      where:   { id: req.params.id },
      include: { lessons: { where: { isActive: true }, orderBy: { order: 'asc' } } },
    });
    if (!skill) return res.status(404).json({ error: 'Skill not found.' });

    let prereqs = [];
    try { prereqs = JSON.parse(skill.prerequisites || '[]'); } catch {}

    res.json({ skill: { ...skill, prerequisites: prereqs } });
  } catch (err) { next(err); }
});

module.exports = router;
