const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const tourRouter = express.Router();

// tourRouter.param('id', tourController.checkID);

tourRouter.route('/tour-stats').get(tourController.getTourStats);
tourRouter.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

tourRouter
  .route('/')
  .get(authController.isAuthorized, tourController.getAllTours)
  .post(tourController.createTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = tourRouter;
