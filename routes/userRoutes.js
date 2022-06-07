const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const userRouter = express.Router();

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);

userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);
userRouter.patch(
  '/updateMyPassword',
  authController.isAuthenticated,
  authController.updatePassword
);

userRouter.patch(
  '/updateMe',
  authController.isAuthenticated,
  userController.updateMe
);

userRouter.delete(
  '/deleteMe',
  authController.isAuthenticated,
  userController.deleteMe
);

userRouter.route('/').get(userController.getAllUsers);

userRouter
  .route('/:id/changeRole')
  .patch(
    authController.isAuthenticated,
    authController.isAuthorized('admin'),
    userController.changeRole
  );

userRouter.route('/:id').get(userController.getUser);

module.exports = userRouter;
