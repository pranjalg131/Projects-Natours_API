const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    createdDate: {
      type: Date,
      default: Date.now(),
    },
    name: {
      type: String,
      unique: true,
      required: [true, 'A tour must have a name'],
    },
    // Defining slug for document middleware as properties not in schema cannot be added
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a summary'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'A tour must have a description'],
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: {
      type: [String],
    },
    startDates: {
      type: [Date],
      required: [true, 'A tour must have start dates'],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual Properties - They define bussiness logic which can be derived from other properties in the database
// These only show up in the requests and are defined over here to make the controllers thin.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Document middleware : runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Query Middleware
// This middleware is used to hide some special tours from the users
// Using a regex to match all the types of find methods.
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // using $ne as all tours do not have that property.
  this.start = Date.now();
  next();
});

// The order of arguments matter hence docs is to be listed even when not used.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  next();
});

// Aggregation Middleware
// to remove secret tours from stats and monthly plan calculations.
tourSchema.pre('aggregate', function (next) {
  // this.pipeline() is the current pipeline array , we add a stage in the beginning to our requirements
  // shift -> adds to the end, unshift -> adds to the start. (In array)
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
