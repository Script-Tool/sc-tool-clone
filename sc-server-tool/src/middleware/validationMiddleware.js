const { body, validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../constants/httpStatus');

exports.validateServiceStatus = [
  body('order_id').notEmpty().withMessage('order_id is required'),
  body('is_active').isBoolean().withMessage('is_active must be a boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    next();
  }
];