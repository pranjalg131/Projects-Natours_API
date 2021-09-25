const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json());

const port = 3000;

const PATH = `${__dirname}/dev-data/data/tours-simple.json`;

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the server side', app: 'natours' });
// });

// app.post('/', (req, res) => {
//   res.send('You can post to this endpoint...');
// });

const tours = JSON.parse(fs.readFileSync(PATH));

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

app.get('/api/v1/tours/:id', (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  if (!tour) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid ID',
    });
  } else {
    res.json({
      status: 'success',
      tour,
    });
  }
});

app.post('/api/v1/tours', (req, res) => {
  console.log(req.body);
  const newTour = { id: tours[tours.length - 1].id + 1, ...req.body };
  tours.push(newTour);
  fs.writeFile(PATH, JSON.stringify(tours), (err) => {
    res.status(201).json({
      status: 'success',
      data: newTour,
    });
  });
});

app.listen(port, () => {
  console.log(`App is running on port ${port}...`);
});
