const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// MIDDLEWARE
app.use(express.json());

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.all('/', (req, res, next) =>
  res.status(200).json({
    status: 200,
    available_routes: ['/api/v1/tours', '/api/v1/users', '/api/v1/reviews'],
  })
);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// This section will be reached only when its not handled by the above ones
app.all('*', (req, res, next) => {
  // Wnenever an argument is passed into next() it goes straight to the error middleware.
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4 argument middlewares are by default error middlewares in express
app.use(globalErrorHandler);

module.exports = app;
