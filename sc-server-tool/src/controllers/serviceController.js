const serviceService = require('../services/serviceService.js');
const { HTTP_STATUS } = require('../constants/httpStatus.js');

exports.updateServiceStatus = async (req, res, next) => {
  try {
    const { order_id, is_active } = req.body;

    const result = await serviceService.updateServiceStatus(order_id, is_active);

    res.status(HTTP_STATUS.OK).json(result);
  } catch (error) {
    next(error);
  }
};