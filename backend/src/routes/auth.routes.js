const express = require('express');
const router = express.Router();
const { register } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerValidator } = require('../validators/auth.validators');

// POST /api/auth/register — US-01
router.post('/register', validate(registerValidator), register);

module.exports = router;
