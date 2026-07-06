/**
 * Validation middleware factory
 * Creates middleware that validates request body/query against a Zod schema
 */
const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = source === 'body' ? req.body : req.query;
      const validatedData = schema.parse(dataToValidate);

      // Attach validated data to request
      if (source === 'body') {
        req.validatedBody = validatedData;
      } else {
        req.validatedQuery = validatedData;
      }

      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
};

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  validateRequest,
  asyncHandler,
};
