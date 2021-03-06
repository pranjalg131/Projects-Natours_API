const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router();

// tourRouter.param('id', tourController.checkID);

// redirecting routes to review router, to keep both routers decoupled
tourRouter.use('/:tourId/reviews', reviewRouter);

tourRouter.route('/tour-stats').get(tourController.getTourStats);
tourRouter.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.isAuthenticated,
    authController.isAuthorized('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = tourRouter;
