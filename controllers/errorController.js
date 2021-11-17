const AppError = require('../utils/appError');

// DATABASE ERRORS
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 404);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `Duplicate field value: ${value}, Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// JWT ERRORS
const handleJWTError = () =>
  new AppError('Invalid token. Please login again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! , Please login again', 401);

/* This file has all the functions related to error handling */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // Trusted operaitonal error , can be sent to the end user.
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // 1) Log the error
    console.error(err);

    // 2) Send a generic message to the end user.
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Classic destructuring trick to make an object's copy.
    // This backfires as the name property is in the proto of the err and not on itself
    // Hence use Object.create() to mitigate the issue.
    // https://github.com/jonasschmedtmann/complete-node-bootcamp/issues/55
    let error = Object.create(err);

    // Functions to transform mongoose errors into meaningful ones.
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === `ValidationError`) error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(error, res);
  }

  next();
};
