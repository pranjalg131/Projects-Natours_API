const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// This is included here , as to start listening for events before excuting any code.
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception, Shutting down...');
  // Here we quit as this lands node process into critical state, which can be recovered after restarting.
  process.exit(1); // 0 -> no errors , 1 -> Unhandled Rejections.
});

const mongoose = require('mongoose');
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection, Shutting down...');
  // server.close() quits gracefully rather than hard quitting like process.exit();
  server.close(() => {
    process.exit(1); // 0 -> no errors , 1 -> Unhandled Rejections.
  });
});
