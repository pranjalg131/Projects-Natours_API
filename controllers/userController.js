const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const filter = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (fields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if , user posts password Data.
  if (req.body.password || req.body.confirmPassword)
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );

  if (req.body.role)
    return next(
      new AppError(
        'This route is not for role updating , please contact admin'
      ),
      400
    );
  // 2) Update the user data.
  const filteredData = filter(req.body, 'name', 'email');
  /*
    We do not use the method used in passwordUpdates as it require us to specify all the required fields.
    and for non-sensitive data we can just use findByIdAndUpdate().
  */
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.changeRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const filteredData = filter(req.body, 'role');

  const user = await User.findByIdAndUpdate(id, filteredData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

// No password Updates with this route as the save middleware does not work
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
