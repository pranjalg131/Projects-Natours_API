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
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
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

const User = mongoose.model('User', userSchema);

module.exports = User;
