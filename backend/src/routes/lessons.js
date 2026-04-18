const router = require('express').Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

// GET /api/lessons/:id — single lesson with user progress
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { skill: { select: { id: true, name: true, icon: true, color: true } } },
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });

    let progress = null;
    if (req.user) {
      progress = await prisma.progress.findUnique({
        where: { userId_lessonId: { userId: req.user.id, lessonId: lesson.id } },
      });
    }

    res.json({ lesson, progress });
  } catch (err) { next(err); }
});

module.exports = router;
