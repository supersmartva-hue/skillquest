/**
 * Generate Routes — /api/generate/*
 *
 * POST   /api/generate           — generate notes + MCQs for a topic (OpenAI → PostgreSQL)
 * GET    /api/generate/history   — paginated list of past generations (auth required)
 * GET    /api/generate/:id       — single lesson + its questions by DB id
 */

const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { generate, getHistory, getById } = require('../controllers/generateController');

// Validation rules for POST /api/generate
const generateRules = [
  body('topic')
    .trim()
    .notEmpty()
    .withMessage('topic is required.')
    .isLength({ min: 2, max: 200 })
    .withMessage('topic must be between 2 and 200 characters.'),

  body('model')
    .optional()
    .isIn(['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'])
    .withMessage('model must be one of: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo'),
];

// POST /api/generate  — no auth required (open endpoint)
router.post('/', generateRules, generate);

// GET /api/generate/history  — MUST come before /:id
router.get('/history', authenticate, getHistory);

// GET /api/generate/:id
router.get('/:id', getById);

module.exports = router;
