const express = require('express');
const tourController = require('../controllers/tourControlller');

const tourRouter = express.Router();

tourRouter.param('id', tourController.checkID);

tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.checkBody, tourController.addTour);
tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = tourRouter;
