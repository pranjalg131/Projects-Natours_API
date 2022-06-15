const express = require('express');
const { isAuthenticated } = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

// merge params allows us to access request params defined on the parent routers as well.
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
  .route('/')
  .get(isAuthenticated, reviewController.getAllReviews)
  .post(isAuthenticated, reviewController.createReview);

reviewRouter
  .route('/:id')
  .patch(reviewController.updateReview)
  .delete(reviewController.deleteReview);

module.exports = reviewRouter;
