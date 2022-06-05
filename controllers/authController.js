const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // This is wrong as anyone could decide the roles for themselves
  // const newUser = await User.create(req.body);
  // Hence initially sign up the users with no privliges and then assign them as needed.

  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt, // Only there for testing purposes.
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if the username and password are provided.
  if (!email || !password) {
    // Sending error -> calling next with argument to invoke the global error handling middleware.
    // return - to avoid sending two responses we terminate the function here itself.
    return next(new AppError('Please provide email and password', 400));
  }
  // 2) Check if the user exists and password is correct.
  const user = await User.findOne({ email }).select('+password');

  // The second condition can be evaluated when user exists.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everytihng is okay, send the token.
  createSendToken(user, 200, res);
});

// Very important to mark functions in catchAsync as async otherwise catch isn't available on them.
exports.isAuthenticated = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get the token from the request and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in , Please log in to continue'),
      401
    );
  }

  // 2) Token verification
  // We convert the callback form of JWT function into async await style, so first we promisify the function.
  // Then the function is called with the necessary arguments.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // If the code reaches here that means the token was issued by us.
  // 3) Check if the user still exits
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('User belonging to this token does not exist', 401)
    );
  }

  // 4) Check if the user has changed passwords since the token was issued.
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, Please login again')
    );
  }

  // If the code has made this far means the credentials are authentic.
  // Making the user data available for the subsequent protected middlewares.
  req.user = freshUser;
  // GRANT ACCESS TO THE PROTECTED ROUTE
  next();
});

exports.isAuthorized =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get the user based on the POSTed email.
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user)
    return next(new AppError('No user found with the email specified', 404));

  // 2) Generate the unique reset token.
  const resetToken = user.createPasswordResetToken();
  // Inside the createPasswordResetToken() , the document was modified but till now has not been saved.
  // Now while saving the validators (like the confirm password one ) run again, so disable them.
  await user.save({ validateBeforeSave: false });
  // 3) Send it back via email.
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password , submit a PATCH request with your password and confirmPassword to: ${resetUrl}\n If you did not initiate this request please ignore this email`;

  try {
    // since when try fails we have to do multiple things , hence a simple wrapper would not suffice
    // hence using try catch.
    // Be careful of the property names, they caused a real nightmare with me.
    await sendEmail({
      email,
      subject: 'Your reset password link (valid for 10 mins)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    // Again the document is modified here , but not saved.
    await user.save({ validateBeforeSave: false });

    // After undoing all the changes , we can report an error.
    return next(
      new AppError(
        'There was an error while sending the email, Please try again later!',
        500 // server Error
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Extract the necessary details.
  const { password, confirmPassword } = req.body;

  // The token in the argument is unencrypted, but we have stored the encrypted one.
  const hasshedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // 1) Get user based on token.
  const user = await User.findOne({
    passwordResetToken: hasshedToken,
    // Simple rule for timestamps , the one which is ahead is in future.
    passwordResetExpiresIn: { $gt: Date.now() },
  });

  // 2) If token not expired and their is a user , set the new password.
  if (!user) {
    return next(new AppError('The token is invalid or has expired!', 400));
  }

  user.password = password;
  user.confirmPassword = confirmPassword;
  // Resetting these settings for future use.
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;

  // Again the document was only modified till this point and not saved.
  await user.save(); // No custom options as this time we need the validators to run the checks.

  // 3) Update changePasswordAt property for the user.
  // This will be done as a part of the model, as we want it to happen automatically.
  // And also following the thin controller , fat model paradigm.

  // 4) Log the user in, and send the JWT.
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // This is for logged in users, hence user information is available on req.user

  // 1) Get the user from collection.
  // Since we need the password , we select it explicitly.
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check the POSTed password is correct.
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }
  // 3) If so , update the password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmNewPassword;
  // We do not disable validators as we want them to check the new password against our contraints.
  await user.save();

  // 4) Then log the user back in by sending another token.
  createSendToken(user, 200, res);
});
