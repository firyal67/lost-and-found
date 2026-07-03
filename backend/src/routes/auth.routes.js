const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validators');

// US-01
router.post('/register', validate(registerValidator), register);

// US-02
router.post('/login', validate(loginValidator), login);

module.exports = router;
