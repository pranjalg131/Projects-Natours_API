const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: `${__dirname}/config.env` });

const mongoose = require('mongoose');
const Tours = require('./models/tourModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours.json`, 'utf-8', (err) =>
    console.log(err)
  )
);

const importData = async () => {
  try {
    await Tours.create(tours);
    console.log('Data successfully imported');
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
};

const deleteData = async () => {
  try {
    await Tours.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit(0);
};

if (process.argv[2] === '--import-data') {
  importData();
}

if (process.argv[2] === '--delete-data') {
  deleteData();
}
