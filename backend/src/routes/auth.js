/**
 * Auth Routes — /api/auth/*
 */

const router = require('express').Router();
const { body } = require('express-validator');
const { signup, login, refreshToken, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Signup validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username: 3-20 chars, letters/numbers/underscores only'),
  body('displayName')
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be 2-50 characters'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password needs uppercase, lowercase, and a number'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);

module.exports = router;
