const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { completeLesson, getUserProgress, getXPHistory } = require('../controllers/progressController');

router.post('/complete-lesson', authenticate, completeLesson);
router.get('/user', authenticate, getUserProgress);
router.get('/xp-history', authenticate, getXPHistory);

module.exports = router;
