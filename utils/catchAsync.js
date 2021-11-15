// The double arrow signifies that the everything after the first arrow is returned by catchAsync()
// That means a function is returned by catchAsync().
module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err));
};
