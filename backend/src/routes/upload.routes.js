const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const { authenticateJWT } = require('../middleware/auth.middleware');
const { uploadLimiter } = require('../config/rate-limiter');

router.post('/', authenticateJWT, uploadLimiter, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must not exceed 5 MB'
        : err.message;
      return res.status(422).json({ success: false, message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }
    const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    return res.status(201).json({ success: true, data: { url } });
  });
});

module.exports = router;