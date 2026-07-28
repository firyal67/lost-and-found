const { validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

/**
 * Strips all HTML tags from a string value (no tags allowed).
 * Used as a custom sanitizer via express-validator's customSanitizer().
 * Prevents XSS payloads being stored in the database.
 */
const stripTags = (value) => {
  if (typeof value !== 'string') return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
};

/**
 * validate(validations)
 *
 * Runs all express-validator validation chains, then returns a structured
 * 422 response on the first failure. Passes through on success.
 */
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((v) => v.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validate;
module.exports.stripTags = stripTags;
