const express = require('express');
const { isAuthenticated } = require('../controllers/authController');
const reviewController = require('../controllers/reviewController');

const reviewRouter = express.Router();

reviewRouter
  .route('/')
  .get(isAuthenticated, reviewController.getAllReviews)
  .post(isAuthenticated, reviewController.createReview);

module.exports = reviewRouter;
