const express = require('express');
const tourController = require('../controllers/tourControlller');

const tourRouter = express.Router();

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.addTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = tourRouter;
