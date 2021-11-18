const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on create() and save() and not on update.
      validator: function (el) {
        return this.password === el;
      },
      message: 'Passwords do not match!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpiresIn: Date,
});

// Using a pre-save middleware to hash the passwords.
userSchema.pre('save', async function (next) {
  // If password is not modified return
  if (!this.isModified('password')) next();

  // Hashing the password with bcrypt with a cost of 12;
  this.password = await bcrypt.hash(this.password, 12);

  // Setting the confirm password to null to avoid leakage.
  this.confirmPassword = undefined;

  next();
});

// This is called an instance method.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  correctPassword
) {
  return await bcrypt.compare(candidatePassword, correctPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // If JWT is issued before passwordChange , then return true.
    // The one issued earlier is smaller as less time has passed from 1970 to that event.
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // This the plain text token , which will be sent via email
  const resetToken = crypto.randomBytes(32).toString('hex');

  // We store this token in our database with encryption to verify against it later
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetToken = passwordResetToken;

  // Token has an expiration time of 10 mins
  this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetExpiresIn);
  // Return the unhashed token to be sent via email.
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
