const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);

    // Adding custom 404 errors
    if (!doc) {
      return next(new AppError("Can't find document with that ID", 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
