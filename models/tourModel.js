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
      minlength: [10, 'A name must have more than or equal to 10 characters'],
      maxlength: [40, 'A name must have less than or equal to 40 characters'],
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
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // validators with the this keyword point to the current document only while creating a NEW document and not while updating.
          return val < this.price;
        },
        // VALUE contains the same value, the user entered while creation of the document.
        message: 'The price discount ({VALUE}) cannot be greater than price',
      },
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
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual Properties - They define bushiness logic which can be derived from other properties in the database
// These only show up in the requests and are defined over here to make the controllers thin.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Document middleware : runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Pre save middleware to fetch all users corresponding to guides in the tour document.
// This embeds the users into the tour document, not a good solution for updating as,when user changes corresponding tours will also have to change.

// tourSchema.pre('save', async function (next) {
//   // This returns an array of promises, so await them to assign them to the final array.
//   const userPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(userPromises);

//   next();
// });

// Query Middleware
// This middleware is used to hide some special tours from the users
// Using a regex to match all the types of find methods.
// tourSchema.pre('find', function (next) {

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // using $ne as all tours do not have that property.
  this.start = Date.now();
  next();
});

// This fetches the references in the tours document , which point to the users who are listed as guides in the document
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
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
